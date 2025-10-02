const { Op } = require('sequelize');
const { Appointment } = require('../models');
const { getPlanLimit } = require('../config/planConfig');

const COUNT_STATUSES = ['pending', 'confirmed', 'rescheduled'];

const enforceMonthlyLimit = async (req, res, next) => {
  const subscription = req.subscription;

  if (!subscription) {
    return res.status(500).json({ error: 'Assinatura não carregada para validação de limite.' });
  }

  try {
    const plan = subscription.plan;
    const planKey = plan?.key;
    const fallbackLimit = plan?.monthlyLimit ?? null;
    const limit = getPlanLimit(planKey, fallbackLimit);

    if (!limit || limit <= 0) {
      req.subscriptionUsage = {
        used: 0,
        limit: limit ?? 0,
        remaining: limit ?? 0,
      };
      return next();
    }

    const startsAt = new Date(subscription.startsAt);
    const expiresAt = new Date(subscription.expiresAt);

    const used = await Appointment.count({
      where: {
        userId: req.subscriptionUserId ?? subscription.userId,
        status: { [Op.in]: COUNT_STATUSES },
        createdAt: {
          [Op.gte]: startsAt,
          [Op.lt]: expiresAt,
        },
      },
    });

    if (used >= limit) {
      console.warn(`[appointments] Usuário ${subscription.userId} atingiu o limite mensal (${limit}).`);
      return res.status(403).json({
        error: 'Limite de agendamentos atingido para este ciclo. Aguarde o próximo período ou atualize seu plano.',
      });
    }

    req.subscriptionUsage = {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
    };

    return next();
  } catch (error) {
    console.error('Erro ao validar limite mensal de agendamentos:', error);
    return res.status(500).json({ error: 'Erro ao validar limite mensal.' });
  }
};

module.exports = enforceMonthlyLimit;
