const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createSubscription,
  getMySubscription,
} = require('../controllers/subscriptionController');

const router = express.Router();

router.post('/subscriptions', authenticateToken, createSubscription);
router.get('/subscriptions/me', authenticateToken, getMySubscription);

module.exports = router;
