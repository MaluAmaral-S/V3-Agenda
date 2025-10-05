const { Op } = require('sequelize');
const { Subscription, Plan, Appointment } = require('../models');
const { getPlanLimit } = require('../config/planConfig');
const callMercadoPagoAPI = require('../lib/mercadoPagoApi');

const COUNT_STATUSES = ['pending', 'confirmed', 'rescheduled'];

const diffInDays = (end, start) => {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff = end.getTime() - start.getTime();
  return Math.max(Math.ceil(diff / oneDayMs), 0);
};

const countUsage = async (userId, startsAt, expiresAt) => {
  return Appointment.count({
    where: {
      userId,
      status: { [Op.in]: COUNT_STATUSES },
      createdAt: {
        [Op.gte]: startsAt,
        [Op.lt]: expiresAt,
      },
    },
  });
};

const mapRemoteStatus = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (['authorized', 'active'].includes(normalized)) {
    return 'active';
  }
  if (['paused'].includes(normalized)) {
    return 'active_until_end_of_cycle';
  }
  if (['cancelled', 'canceled', 'expired'].includes(normalized)) {
    return 'canceled';
  }
  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const syncSubscriptionWithMercadoPago = async (subscription) => {
  if (!subscription?.mpSubscriptionId) {
    return subscription;
  }
  try {
    // Corrected endpoint to use /preapproval/ instead of /v1/subscriptions/
    const remote = await callMercadoPagoAPI('GET', `/preapproval/${subscription.mpSubscriptionId}`);
    if (!remote) {
      return subscription;
    }
    const updates = {};
    const mappedStatus = mapRemoteStatus(remote.status);
    if (mappedStatus && mappedStatus !== subscription.status) {
      updates.status = mappedStatus;
    }
    const periodStart = parseDate(remote.date_created);
    if (periodStart && (!subscription.startsAt || subscription.startsAt.getTime() !== periodStart.getTime())) {
      updates.startsAt = periodStart;
    }
    const periodEnd = parseDate(remote.next_payment_date);
    if (periodEnd && (!subscription.expiresAt || subscription.expiresAt.getTime() !== periodEnd.getTime())) {
      updates.expiresAt = periodEnd;
    }
    if (Object.keys(updates).length > 0) {
      await subscription.update(updates);
      await subscription.reload({ include: [{ model: Plan, as: 'plan' }] });
    }
  } catch (error) {
    if (error?.statusCode === 404) {
      await subscription.update({ status: 'canceled' });
    } else {
      console.error('Erro ao sincronizar assinatura com o Mercado Pago:', error);
    }
  }
  return subscription;
};

const getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Nao autenticado.' });
    }

    let subscription = await Subscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'active_until_end_of_cycle', 'pending'] },
      },
      include: [{ model: Plan, as: 'plan' }],
      order: [['createdAt', 'DESC']],
    });

    if (!subscription) {
      return res.json({ hasActive: false });
    }

    if (subscription.mpSubscriptionId) {
      subscription = await syncSubscriptionWithMercadoPago(subscription);
    }

    if (!subscription.mpSubscriptionId) {
      return res.json({
        hasActive: false,
        legacySubscription: true,
        message: 'Sua assinatura nao esta vinculada ao Mercado Pago. Escolha um plano para migrar para o novo processo de cobranca.',
      });
    }

    if (subscription.status === 'pending') {
      return res.json({
        hasActive: false,
        pending: true,
        message: 'Assinatura aguardando confirmacao de pagamento.',
      });
    }

    if (subscription.status === 'canceled') {
      return res.json({ hasActive: false });
    }

    const now = new Date();
    const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
    if (expiresAt && expiresAt <= now) {
      await subscription.update({ status: 'canceled' });
      return res.json({ hasActive: false });
    }

    const startsAt = subscription.startsAt ? new Date(subscription.startsAt) : null;
    const hasPlanRecord = Boolean(subscription.plan);
    const limit = hasPlanRecord
      ? getPlanLimit(subscription.plan.key, subscription.plan.monthlyLimit)
      : null;
    const used = startsAt && expiresAt ? await countUsage(userId, startsAt, expiresAt) : 0;
    const remaining = limit !== null && limit !== undefined ? Math.max(limit - used, 0) : null;

    const planData = hasPlanRecord
      ? {
          key: subscription.plan.key,
          name: subscription.plan.name,
          monthlyLimit: limit,
          mpPlanId: subscription.mpPlanId,
        }
      : {
          name: subscription.planName || 'Assinatura ativa',
          amount: subscription.planAmount ? Number(subscription.planAmount) : null,
          currency: subscription.planCurrency || 'BRL',
          frequency: subscription.planFrequency,
          frequencyType: subscription.planFrequencyType,
          planless: true,
        };

    const response = {
      hasActive: true,
      plan: planData,
      subscription: {
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
        daysLeft: expiresAt ? diffInDays(expiresAt, now) : null,
        mpSubscriptionId: subscription.mpSubscriptionId,
      },
      usage: {
        used,
        remaining,
        limit,
      },
    };

    if (subscription.status === 'active_until_end_of_cycle') {
      response.renewalCancelled = true;
    }

    return res.json(response);
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return res.status(500).json({ error: 'Erro ao buscar assinatura.' });
  }
};

module.exports = {
  getMySubscription,
};