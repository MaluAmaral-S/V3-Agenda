
const { Op } = require('sequelize');
const { Subscription } = require('../models');
const callMercadoPagoAPI = require('../lib/mercadoPagoApi');

async function updateMercadoPagoSubscription(mpSubscriptionId, body) {
  const endpoints = [`/preapproval/${mpSubscriptionId}`, `/v1/subscriptions/${mpSubscriptionId}`];
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      await callMercadoPagoAPI('PUT', endpoint, body);
      return;
    } catch (error) {
      lastError = error;
      const status = error?.statusCode;
      if (status && [400, 404].includes(status)) {
        continue;
      }
      throw error;
    }
  }
  if (lastError) {
    throw lastError;
  }
}

/**
 * Cancel the automatic renewal of an active subscription. The user's access
 * remains valid until the end of the current billing period. Internally we
 * try to pause the subscription on Mercado Pago by setting the status to
 * "paused" on the remote subscription. Afterwards the local subscription
 * status becomes `active_until_end_of_cycle` so features can keep working
 * until the current period ends.
 *
 * Route: PUT /api/assinaturas/cancelar-renovacao
 */
async function cancelRenewal(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'active_until_end_of_cycle'] },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura ativa nao encontrada.' });
    }
    if (!subscription.mpSubscriptionId) {
      await subscription.update({ status: 'canceled' });
      return res.status(409).json({
        error: 'Sua assinatura atual nao esta vinculada ao Mercado Pago. Assine novamente para gerenciar pelo cartao.',
      });
    }
    await updateMercadoPagoSubscription(subscription.mpSubscriptionId, { status: 'paused' });
    await subscription.update({ status: 'active_until_end_of_cycle' });
    return res.json({
      message: 'Renovacao automatica cancelada. Seu acesso continua ate o fim do ciclo atual.',
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    console.error('Erro ao cancelar renovacao:', error);
    const status = error?.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Erro ao cancelar renovacao.' });
  }
}

/**
 * Update the payment method used for an existing subscription. The frontend
 * should tokenize the card using the Mercado Pago SDK and send the resulting
 * `cardToken` in the request body.
 *
 * Route: PUT /api/assinaturas/atualizar-pagamento
 */
async function updatePaymentMethod(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }
    const { cardToken } = req.body;
    if (!cardToken || typeof cardToken !== 'string') {
      return res.status(422).json({ error: 'Token do cartao (cardToken) e obrigatorio.' });
    }
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: { [Op.in]: ['active', 'active_until_end_of_cycle'] },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!subscription) {
      return res.status(404).json({ error: 'Assinatura ativa nao encontrada para atualizacao.' });
    }
    if (!subscription.mpSubscriptionId) {
      return res.status(409).json({
        error: 'Nao foi possivel localizar a assinatura no Mercado Pago. Crie uma nova assinatura para atualizar o cartao.',
      });
    }
    await updateMercadoPagoSubscription(subscription.mpSubscriptionId, { card_token_id: cardToken });
    return res.json({ message: 'Forma de pagamento atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error);
    const status = error?.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Erro ao atualizar forma de pagamento.' });
  }
}

module.exports = {
  cancelRenewal,
  updatePaymentMethod,
};
