// src/config/mercadoPagoConfig.js

/**
 * Determines the Mercado Pago API mode based on the environment variable.
 * Defaults to 'development' if the variable is not set or is invalid.
 *
 * @returns {'development' | 'production'} The current mode for Mercado Pago API calls.
 */
function getMercadoPagoMode() {
  const mode = process.env.MERCADO_PAGO_MODE?.toLowerCase();
  if (mode === 'production') {
    return 'production';
  }
  return 'development';
}

/**
 * Checks if the current Mercado Pago mode is set to development (sandbox).
 *
 * @returns {boolean} True if the mode is 'development', false otherwise.
 */
function isMercadoPagoDevelopmentMode() {
  return getMercadoPagoMode() === 'development';
}

/**
 * Selects the appropriate checkout URL from a Mercado Pago API response.
 * It prioritizes the sandbox URL if available and in development mode.
 * It checks multiple common fields for the URL for resilience.
 *
 * @param {object | null} mpResponse - The response object from Mercado Pago API.
 * @returns {string | null} The selected checkout URL or null if not found.
 */
function selectMercadoPagoCheckoutUrl(mpResponse) {
  if (!mpResponse) {
    return null;
  }

  const isSandbox = isMercadoPagoDevelopmentMode();

  // Possible fields for the checkout URL in different MP API responses
  const sandboxUrl = mpResponse.sandbox_init_point || mpResponse.sandbox_url || mpResponse.test_url;
  const productionUrl = mpResponse.init_point || mpResponse.url || mpResponse.checkout_url;

  if (isSandbox && sandboxUrl) {
    return sandboxUrl;
  }

  // Fallback to production URL if not in sandbox or if sandbox URL is missing
  return productionUrl || sandboxUrl || null;
}

module.exports = {
  getMercadoPagoMode,
  isMercadoPagoDevelopmentMode,
  selectMercadoPagoCheckoutUrl,
};