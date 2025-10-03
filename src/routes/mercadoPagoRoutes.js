const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const {
  createPlan,
  createSubscription,
  handleWebhook,
} = require('../controllers/mercadoPagoController');

const router = express.Router();

// Prefix all routes with /mercadopago in the server file

// Route to create a new plan on Mercado Pago.  Requires the user to be
// authenticated and have administrative privileges.  See adminOnly
// middleware for details.
router.post('/plans', authenticateToken, adminOnly, createPlan);

// Route to create a new subscription for the logged-in user.  Requires
// authentication.
router.post('/subscriptions', authenticateToken, createSubscription);

// Webhook endpoint to receive notifications from Mercado Pago.  Webhooks
// should not require authentication because they are invoked by Mercado Pago.
router.post('/webhook', handleWebhook);

module.exports = router;