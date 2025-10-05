const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getMySubscription,
} = require('../controllers/subscriptionController');

const router = express.Router();

router.get('/subscriptions/me', authenticateToken, getMySubscription);

module.exports = router;
