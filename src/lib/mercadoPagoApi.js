const https = require('https');
const { getMercadoPagoApiHost } = require('../config/mercadoPagoConfig');

/**
 * Perform an authenticated request to the Mercado Pago REST API. The
 * authentication token is read from the MERCADO_PAGO_ACCESS_TOKEN environment
 * variable. The returned promise resolves with the parsed JSON response if
 * the status code is within the 2xx range, otherwise it rejects with an
 * error containing the status code and parsed payload. This helper is
 * intentionally kept in a separate module so it can be reused across
 * controllers (e.g. subscription management) without creating circular
 * dependencies.
 *
 * @param {string} method HTTP verb (GET, POST, PUT, etc.)
 * @param {string} path Request path beginning with '/'
 * @param {Object} [body] Optional request body. Will be JSON stringified
 * @returns {Promise<any>} Parsed JSON response from Mercado Pago
 */
async function callMercadoPagoAPI(method, path, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return reject(new Error('Mercado Pago access token is not configured'));
    }

    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: getMercadoPagoApiHost(),
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = responseBody ? JSON.parse(responseBody) : {};
        } catch (err) {
          return reject(new Error('Failed to parse Mercado Pago response'));
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          return resolve(parsed);
        }
        const message = parsed && parsed.message ? parsed.message : `HTTP ${res.statusCode}`;
        const error = new Error(`Mercado Pago API error: ${message}`);
        error.statusCode = res.statusCode;
        error.payload = parsed;
        return reject(error);
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

module.exports = callMercadoPagoAPI;
