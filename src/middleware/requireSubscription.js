const { Subscription, Plan } = require('../models');

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

    const subscription = await Subscription.findOne({
      where: { userId, status: 'active' },
      include: [{ model: Plan, as: 'plan' }],
      order: [['startsAt', 'DESC']],
    });

    if (!subscription) {
      console.warn(`[subscriptions] Usuário ${userId} sem assinatura ativa.`);
      return res.status(403).json({ error: 'Usuário sem assinatura ativa.' });
    }

    const now = new Date();
    const expiresAt = new Date(subscription.expiresAt);

    if (expiresAt <= now) {
      await subscription.update({ status: 'expired' });
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
