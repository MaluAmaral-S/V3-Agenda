const { Plan, Subscription, User } = require('../models');
const callMercadoPagoAPI = require('../lib/mercadoPagoApi');
const {
  getMercadoPagoMode,
  isMercadoPagoDevelopmentMode,
  selectMercadoPagoCheckoutUrl,
} = require('../config/mercadoPagoConfig');

/**
 * Creates or updates a subscription plan on Mercado Pago and saves it to the local database.
 * This is an admin-only operation.
 */
async function createPlan(req, res) {
  try {
    const { key, name, price, frequency, frequencyType } = req.body;

    if (!key || !name || !price) {
      return res.status(400).json({ error: 'Key, name, and price are required for the plan.' });
    }

    const normalizedKey = String(key).toLowerCase();
    const existing = await Plan.findOne({ where: { key: normalizedKey } });
    if (existing && existing.mpPlanId) {
      return res.status(409).json({ error: 'Plan already exists and is linked to Mercado Pago.' });
    }

    const planPrice = Number(price);
    const planFrequency = Number(frequency) || 1;
    const planFrequencyType = frequencyType || 'months';

    const payload = {
      reason: name,
      auto_recurring: {
        frequency: planFrequency,
        frequency_type: planFrequencyType,
        transaction_amount: planPrice,
        currency_id: 'BRL',
      },
      // back_url is not valid here, it's set per-subscription.
    };

    const mpResponse = await callMercadoPagoAPI('POST', '/preapproval_plan', payload);
    const mpPlanId = mpResponse?.id;

    if (!mpPlanId) {
      return res.status(500).json({ error: 'Failed to create plan on Mercado Pago.' });
    }

    const planData = {
      mpPlanId,
      price: planPrice,
      frequency: planFrequency,
      frequencyType: planFrequencyType,
    };

    let plan;
    if (existing) {
      plan = existing;
      await plan.update(planData);
    } else {
      plan = await Plan.create({
        key: normalizedKey,
        name,
        monthlyLimit: 0, // Or some other default
        ...planData,
      });
    }

    return res.status(201).json({
      message: 'Plan created successfully.',
      plan: { id: plan.id, key: plan.key, name: plan.name, mpPlanId: plan.mpPlanId },
      mercadoPago: mpResponse,
    });
  } catch (error) {
    console.error('Error creating Mercado Pago plan:', error);
    return res.status(500).json({ error: error.message || 'Error creating plan.' });
  }
}

/**
 * Creates a new subscription using the Checkout Pro flow.
 * It generates a payment link for the user to complete the payment on Mercado Pago.
 */
async function createSubscription(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { planKey, backUrl } = req.body || {};
    if (!planKey) {
      return res.status(400).json({ error: 'planKey is required.' });
    }

    const plan = await Plan.findOne({ where: { key: String(planKey).toLowerCase() } });
    if (!plan || !plan.mpPlanId) {
      return res.status(404).json({ error: 'Plan not found or not linked to Mercado Pago.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const webhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('MERCADO_PAGO_WEBHOOK_URL is not set in environment variables.');
      return res.status(500).json({ error: 'Webhook URL is not configured.' });
    }

    const payload = {
      preapproval_plan_id: plan.mpPlanId,
      payer_email: user.email,
      back_url: backUrl || process.env.MERCADO_PAGO_BACK_URL,
      notification_url: webhookUrl,
    };

    const mpResponse = await callMercadoPagoAPI('POST', '/preapproval', payload);
    const mpSubscriptionId = mpResponse?.id;
    const checkoutUrl = selectMercadoPagoCheckoutUrl(mpResponse);

    if (!mpSubscriptionId || !checkoutUrl) {
      console.error('Mercado Pago response missing ID or checkout URL:', mpResponse);
      return res.status(500).json({ error: 'Failed to create subscription checkout on Mercado Pago.' });
    }

    await Subscription.update(
      { status: 'canceled', expiresAt: new Date() },
      { where: { userId, status: 'active' } }
    );

    const subscriptionRecord = await Subscription.create({
      userId,
      planId: plan.id,
      mpPlanId: plan.mpPlanId,
      mpSubscriptionId,
      status: 'pending',
      planName: plan.name,
      planAmount: plan.price,
      planCurrency: 'BRL',
      planFrequency: plan.frequency,
      planFrequencyType: plan.frequencyType,
    });

    return res.status(201).json({
      message: 'Subscription checkout created. Redirect user to complete payment.',
      checkoutUrl,
      subscriptionId: subscriptionRecord.id,
      mpSubscriptionId,
    });
  } catch (error) {
    console.error('Error creating Mercado Pago subscription:', error);
    return res.status(500).json({ error: error.message || 'Error creating subscription.' });
  }
}

/**
 * Handles incoming webhooks from Mercado Pago.
 * It processes payment and preapproval notifications to keep the subscription status in sync.
 */
async function handleWebhook(req, res) {
  try {
    const { body, query } = req;
    const topic = body.topic || body.type;

    console.log(`Webhook received: topic=${topic}`, { body, query });

    if (topic === 'payment' && body.data?.id) {
      await handlePaymentNotification(body.data.id);
    } else if (topic === 'preapproval' && body.data?.id) {
      await handlePreapprovalNotification(body.data.id);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    return res.status(500).send('Error processing webhook');
  }
}

/**
 * Processes payment notifications.
 * @param {string} paymentId The ID of the payment from Mercado Pago.
 */
async function handlePaymentNotification(paymentId) {
  const payment = await callMercadoPagoAPI('GET', `/v1/payments/${paymentId}`);
  if (!payment?.preapproval_id) {
    console.warn(`Payment ${paymentId} not found or not related to a subscription.`);
    return;
  }

  const mpSubscriptionId = payment.preapproval_id;
  const subscription = await Subscription.findOne({ where: { mpSubscriptionId } });
  if (!subscription) {
    console.warn(`Webhook for unknown subscription ${mpSubscriptionId}`);
    return;
  }

  if (payment.status === 'approved') {
    const mpSubscription = await callMercadoPagoAPI('GET', `/preapproval/${mpSubscriptionId}`);
    await subscription.update({
      status: 'active',
      expiresAt: mpSubscription?.next_payment_date ? new Date(mpSubscription.next_payment_date) : null,
    });
    console.log(`Subscription ${subscription.id} activated/renewed based on payment ${paymentId}.`);
  }
}

/**
 * Processes subscription (preapproval) lifecycle notifications.
 * @param {string} mpSubscriptionId The ID of the subscription from Mercado Pago.
 */
async function handlePreapprovalNotification(mpSubscriptionId) {
  const mpSubscription = await callMercadoPagoAPI('GET', `/preapproval/${mpSubscriptionId}`);
  if (!mpSubscription) {
    console.warn(`Preapproval notification for unknown subscription ${mpSubscriptionId}`);
    return;
  }

  const subscription = await Subscription.findOne({ where: { mpSubscriptionId } });
  if (!subscription) {
    console.warn(`Local subscription not found for mpSubscriptionId ${mpSubscriptionId}`);
    return;
  }

  let localStatus = subscription.status;
  if (mpSubscription.status === 'authorized') {
    localStatus = 'active';
  } else if (['paused', 'cancelled'].includes(mpSubscription.status)) {
    localStatus = 'canceled';
  } else if (mpSubscription.status === 'pending') {
    localStatus = 'pending';
  }

  if (localStatus !== subscription.status) {
    await subscription.update({ status: localStatus });
    console.log(`Subscription ${subscription.id} status updated to ${localStatus} based on preapproval notification.`);
  }
}

module.exports = {
  createPlan,
  createSubscription,
  handleWebhook,
};