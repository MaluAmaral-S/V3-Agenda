const DEFAULT_MODE = 'production';
const DEFAULT_HOST = 'api.mercadopago.com';

function normalizeMode(rawMode) {
  if (!rawMode) {
    return DEFAULT_MODE;
  }
  const value = String(rawMode).trim().toLowerCase();
  if (['development', 'dev', 'sandbox', 'test'].includes(value)) {
    return 'development';
  }
  if (['production', 'prod', 'live'].includes(value)) {
    return 'production';
  }
  return DEFAULT_MODE;
}

function getMercadoPagoMode() {
  return normalizeMode(process.env.MERCADO_PAGO_MODE);
}

function isMercadoPagoDevelopmentMode() {
  return getMercadoPagoMode() !== 'production';
}

function getMercadoPagoApiHost() {
  const envHost = process.env.MERCADO_PAGO_API_HOST;
  if (envHost && typeof envHost === 'string' && envHost.trim().length > 0) {
    return envHost.trim();
  }
  return DEFAULT_HOST;
}

function pickFirstString(values) {
  if (!Array.isArray(values)) {
    return null;
  }
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function selectMercadoPagoCheckoutUrl(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }
  const pointOfInteraction = response.point_of_interaction || {};
  const transactionData = pointOfInteraction.transaction_data || {};
  const productionCandidates = [
    response.init_point,
    response.init_url,
    response.checkout_url,
    transactionData.ticket_url,
    transactionData.checkout_url,
  ];
  const sandboxCandidates = [
    response.sandbox_init_point,
    response.sandbox_init_url,
    transactionData.sandbox_init_point,
    transactionData.sandbox_checkout_url,
  ];
  const sandboxUrl = pickFirstString(sandboxCandidates);
  const productionUrl = pickFirstString(productionCandidates);
  if (isMercadoPagoDevelopmentMode()) {
    return sandboxUrl || productionUrl || null;
  }
  return productionUrl || sandboxUrl || null;
}

module.exports = {
  getMercadoPagoMode,
  isMercadoPagoDevelopmentMode,
  getMercadoPagoApiHost,
  selectMercadoPagoCheckoutUrl,
};
