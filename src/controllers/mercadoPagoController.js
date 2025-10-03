const { Plan, Subscription, User } = require('../models');
const callMercadoPagoAPI = require('../lib/mercadoPagoApi');
const { getMercadoPagoMode, isMercadoPagoDevelopmentMode, selectMercadoPagoCheckoutUrl } = require('../config/mercadoPagoConfig');

function sanitizeAmount(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return Number.NaN;
  }
  if (typeof raw === 'number') {
    return raw;
  }
  const value = String(raw).trim();
  if (!value) {
    return Number.NaN;
  }
  const numeric = value.replace(/[^\d,.-]/g, '');
  const normalized = numeric.includes(',') ? numeric.replace(/\./g, '').replace(',', '.') : numeric;
  return Number(normalized);
}

async function createPlan(req, res) {
  try {
    const mercadoPagoMode = getMercadoPagoMode();
    const isSandboxMode = isMercadoPagoDevelopmentMode();
    const { key, name, price, frequency, frequencyType } = req.body;

    if (!key || !name || !price) {
      return res.status(400).json({ error: 'Informe key, name e price do plano.' });
    }

    const normalizedKey = String(key).toLowerCase();
    const existing = await Plan.findOne({ where: { key: normalizedKey } });
    if (existing && existing.mpPlanId) {
      return res.status(409).json({ error: 'Plano ja existe e possui vinculacao no Mercado Pago.' });
    }

    const freq = Number(frequency) || 1;
    const freqType = frequencyType || 'months';

    const payload = {
      reason: name,
      auto_recurring: {
        frequency: freq,
        frequency_type: freqType,
        transaction_amount: Number(price),
        currency_id: 'BRL',
      },
    };

    const mpResponse = await callMercadoPagoAPI('POST', '/v1/plans', payload);
    const mpPlanId = mpResponse && mpResponse.id;
    if (!mpPlanId) {
      return res.status(500).json({ error: 'Falha ao criar plano no Mercado Pago.' });
    }

    let plan;
    if (existing) {
      plan = existing;
      await plan.update({ mpPlanId });
    } else {
      plan = await Plan.create({
        key: normalizedKey,
        name,
        monthlyLimit: 0,
        mpPlanId,
      });
    }

    return res.status(201).json({
      message: 'Plano criado com sucesso.',
      plan: {
        id: plan.id,
        key: plan.key,
        name: plan.name,
        mpPlanId: plan.mpPlanId,
      },
      mercadoPago: mpResponse,
      mercadoPagoMode,
      isMercadoPagoSandbox: isSandboxMode,
    });
  } catch (error) {
    console.error('Erro ao criar plano Mercado Pago:', error);
    return res.status(500).json({ error: error.message || 'Erro ao criar plano.' });
  }
}

async function createSubscription(req, res) {
  try {
    const mercadoPagoMode = getMercadoPagoMode();
    const isSandboxMode = isMercadoPagoDevelopmentMode();
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const {
      planKey,
      amount,
      price,
      currency,
      currencyId,
      frequency,
      frequencyType,
      reason,
      title,
      backUrl,
      returnUrl,
    } = req.body || {};

    const envBackUrl = process.env.MERCADO_PAGO_BACK_URL;
    const normalizedPlanKey = planKey ? String(planKey).toLowerCase() : null;
    let plan = null;

    if (normalizedPlanKey) {
      plan = await Plan.findOne({ where: { key: normalizedPlanKey } });
      if (!plan) {
        return res.status(404).json({ error: 'Plano nao encontrado.' });
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado.' });
    }

    const planDisplayName = (reason || title || plan?.name || 'Assinatura AgendaPro').trim();

    let endpoint = '/v1/subscriptions';
    let payload;
    let mpPlanId = plan?.mpPlanId || null;
    let planAmount = null;
    let planCurrency = null;
    let planFrequency = null;
    let planFrequencyType = null;

    if (mpPlanId) {
      payload = {
        plan_id: mpPlanId,
        payer: {
          email: user.email,
        },
      };
    } else {
      const parsedAmount = sanitizeAmount(amount ?? price);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(422).json({ error: 'Informe o valor da assinatura (amount).' });
      }
      const normalizedCurrency = (currency || currencyId || 'BRL').toString().trim().toUpperCase() || 'BRL';
      const normalizedFrequency = Number(frequency) > 0 ? Number(frequency) : 1;
      const normalizedFrequencyType = (frequencyType || 'months').toString().trim().toLowerCase() || 'months';

      payload = {
        reason: planDisplayName,
        payer_email: user.email,
        auto_recurring: {
          frequency: normalizedFrequency,
          frequency_type: normalizedFrequencyType,
          transaction_amount: parsedAmount,
          currency_id: normalizedCurrency,
        },
      };

      const redirectUrl = backUrl || returnUrl || envBackUrl;
      if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.trim().length > 0) {
        payload.back_url = redirectUrl.trim();
      }

      endpoint = '/preapproval';
      planAmount = parsedAmount;
      planCurrency = normalizedCurrency;
      planFrequency = normalizedFrequency;
      planFrequencyType = normalizedFrequencyType;
    }

    const mpResponse = await callMercadoPagoAPI('POST', endpoint, payload);
    const mpSubscriptionId = mpResponse && (mpResponse.id || mpResponse.subscription_id || mpResponse.preapproval_id || null);
    const checkoutUrl = selectMercadoPagoCheckoutUrl(mpResponse);

    if (!mpSubscriptionId || !checkoutUrl) {
      return res.status(500).json({ error: 'Falha ao criar assinatura no Mercado Pago.' });
    }

    await Subscription.update(
      { status: 'canceled', expiresAt: new Date() },
      { where: { userId, status: 'active' } },
    );

    const subscriptionRecord = await Subscription.create({
      userId,
      planId: plan ? plan.id : null,
      mpPlanId,
      mpSubscriptionId,
      status: 'pending',
      planName: planDisplayName,
      planAmount,
      planCurrency,
      planFrequency,
      planFrequencyType,
    });

    const planSummary = plan
      ? { key: plan.key, name: plan.name, mpPlanId: plan.mpPlanId }
      : {
          name: planDisplayName,
          amount: planAmount,
          currency: planCurrency,
          frequency: planFrequency,
          frequencyType: planFrequencyType,
        };

    return res.status(201).json({
      message: 'Assinatura criada. Redirecione o usuario para concluir o pagamento.',
      checkoutUrl,
      mercadoPagoMode,
      isMercadoPagoSandbox: isSandboxMode,
      usedPlanlessCheckout: !mpPlanId,
      subscription: {
        id: subscriptionRecord.id,
        mpSubscriptionId,
        status: subscriptionRecord.status,
      },
      plan: planSummary,
    });
  } catch (error) {
    console.error('Erro ao criar assinatura Mercado Pago:', error);
    return res.status(500).json({ error: error.message || 'Erro ao criar assinatura.' });
  }
}

async function handleWebhook(req, res) {
  try {
    const body = req.body || {};
    let mpSubscriptionId = null;
    if (body.data) {
      mpSubscriptionId = body.data.id || body.data.subscription_id || body.data.preapproval_id || null;
    }
    if (!mpSubscriptionId) {
      mpSubscriptionId = body.id || body.subscription_id || null;
    }
    if (!mpSubscriptionId) {
      console.warn('Webhook recebido sem id de assinatura:', body);
      return res.status(200).send('OK');
    }

    const subscriptionData = await callMercadoPagoAPI('GET', `/v1/subscriptions/${mpSubscriptionId}`);
    const remoteStatus = (subscriptionData && subscriptionData.status) || '';
    const subscription = await Subscription.findOne({ where: { mpSubscriptionId } });
    if (!subscription) {
      console.warn(`Webhook para assinatura desconhecida ${mpSubscriptionId}`);
      return res.status(200).send('OK');
    }

    let localStatus = subscription.status;
    if (remoteStatus === 'authorized' || remoteStatus === 'active') {
      localStatus = 'active';
    } else if (remoteStatus === 'paused' || remoteStatus === 'cancelled' || remoteStatus === 'canceled') {
      localStatus = 'canceled';
    }

    const startsAt = subscriptionData.current_period_start_date
      ? new Date(subscriptionData.current_period_start_date)
      : subscription.startsAt;
    const expiresAt = subscriptionData.current_period_end_date
      ? new Date(subscriptionData.current_period_end_date)
      : subscription.expiresAt;

    await subscription.update({ status: localStatus, startsAt, expiresAt });
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook Mercado Pago:', error);
    return res.status(500).send('Erro ao processar webhook');
  }
}

module.exports = {
  createPlan,
  createSubscription,
  handleWebhook,
};
