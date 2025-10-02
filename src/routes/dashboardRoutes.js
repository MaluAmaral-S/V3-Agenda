const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/businessController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, getDashboardStats);

module.exports = router;
