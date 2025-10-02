const express = require('express');
const { listPlans } = require('../controllers/planController');

const router = express.Router();

router.get('/plans', listPlans);

module.exports = router;
