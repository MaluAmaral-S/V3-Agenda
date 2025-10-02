const { Op } = require('sequelize');
const { Subscription, Plan, Appointment } = require('../models');
const {
  getPlanLimit,
  getSubscriptionDurationDays,
} = require('../config/planConfig');

const COUNT_STATUSES = ['pending', 'confirmed', 'rescheduled'];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

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

const createSubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { planKey } = req.body;

    if (!planKey || typeof planKey !== 'string') {
      return res.status(422).json({ error: 'Informe o plano desejado.' });
    }

    const normalizedKey = planKey.toLowerCase();

    const plan = await Plan.findOne({ where: { key: normalizedKey, isActive: true } });

    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    await Subscription.update(
      { status: 'canceled', expiresAt: new Date() },
      { where: { userId, status: 'active' } }
    );

    const now = new Date();
    const duration = getSubscriptionDurationDays();
    const expiresAt = addDays(now, duration);

    const subscription = await Subscription.create({
      userId,
      planId: plan.id,
      startsAt: now,
      expiresAt,
      status: 'active',
    });

    return res.status(201).json({
      message: 'Assinatura confirmada (simulação).',
      subscription: {
        id: subscription.id,
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
        status: subscription.status,
      },
      plan: {
        key: plan.key,
        name: plan.name,
        monthlyLimit: getPlanLimit(plan.key, plan.monthlyLimit),
      },
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return res.status(500).json({ error: 'Erro ao criar assinatura.' });
  }
};

const getMySubscription = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const subscription = await Subscription.findOne({
      where: { userId, status: 'active' },
      include: [{ model: Plan, as: 'plan' }],
      order: [['startsAt', 'DESC']],
    });

    if (!subscription) {
      return res.json({ hasActive: false });
    }

    const now = new Date();
    const expiresAt = new Date(subscription.expiresAt);

    if (expiresAt <= now) {
      await subscription.update({ status: 'expired' });
      return res.json({ hasActive: false });
    }

    const startsAt = new Date(subscription.startsAt);
    const limit = getPlanLimit(subscription.plan?.key, subscription.plan?.monthlyLimit);
    const used = await countUsage(userId, startsAt, expiresAt);

    return res.json({
      hasActive: true,
      plan: {
        key: subscription.plan?.key,
        name: subscription.plan?.name,
        monthlyLimit: limit,
      },
      subscription: {
        startsAt: subscription.startsAt,
        expiresAt: subscription.expiresAt,
        daysLeft: diffInDays(expiresAt, now),
      },
      usage: {
        used,
        remaining: limit ? Math.max(limit - used, 0) : null,
        limit,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return res.status(500).json({ error: 'Erro ao buscar assinatura.' });
  }
};

module.exports = {
  createSubscription,
  getMySubscription,
};
