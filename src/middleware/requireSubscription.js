const { Subscription, Plan } = require('../models');
const { Op } = require('sequelize');

const resolveTargetUserId = (req) => {
  if (req.user?.userId) {
    return req.user.userId;
  }

  const candidate = req.params?.id || req.params?.userId || req.body?.userId;
  if (!candidate) {
    return null;
  }

  const parsed = Number(candidate);
  return Number.isNaN(parsed) ? null : parsed;
};

const requireSubscription = async (req, res, next) => {
  try {
    const userId = resolveTargetUserId(req);

    if (!userId) {
      return res.status(400).json({ error: 'Usuário inválido para validação de assinatura.' });
    }

    // Fetch the most recent subscription that is either active or set to remain
    // active until the end of the current cycle.  We intentionally include
    // active_until_end_of_cycle in the search so that users who have
    // cancelled renewal but still have time remaining continue to have access.
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'active_until_end_of_cycle'] },
      },
      include: [{ model: Plan, as: 'plan' }],
      order: [['createdAt', 'DESC']],
    });

    if (!subscription) {
      console.warn(`[subscriptions] Usuário ${userId} sem assinatura ativa.`);
      return res.status(403).json({ error: 'Usuário sem assinatura ativa.' });
    }

    // verify that the subscription has not expired; if it has, mark it as canceled
    const now = new Date();
    if (subscription.expiresAt && new Date(subscription.expiresAt) <= now) {
      await subscription.update({ status: 'canceled' });
      console.warn(`[subscriptions] Assinatura expirada para o usuário ${userId}.`);
      return res.status(403).json({ error: 'Assinatura expirada. Renove para continuar.' });
    }

    req.subscription = subscription;
    req.subscriptionUserId = userId;

    return next();
  } catch (error) {
    console.error('Erro ao validar assinatura ativa:', error);
    return res.status(500).json({ error: 'Erro ao validar assinatura.' });
  }
};

module.exports = requireSubscription;
