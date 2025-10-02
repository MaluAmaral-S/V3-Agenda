// src/routes/businessHoursRoutes.js
const express = require('express');
const router = express.Router();
const businessHoursController = require('../controllers/businessHoursController');
const { protect } = require('../controllers/authController');

// Todas as rotas são protegidas
router.use(protect);

router.route('/')
  .get(businessHoursController.getBusinessHours)
  .post(businessHoursController.saveBusinessHours);

module.exports = router;