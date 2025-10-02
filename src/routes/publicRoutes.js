// src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();

// 1. Importe os controllers que você já utilizava
const {
  getBusinessByName,
  getBusinessServices,
  getBusinessHours,
  getCompleteBusinessData
} = require('../controllers/businessController');

// 2. Importe as funções necessárias do seu appointmentController atualizado
const {
  createAppointment,
  getAvailableSlots,
} = require('../controllers/appointmentController');
const requireSubscription = require('../middleware/requireSubscription');
const enforceMonthlyLimit = require('../middleware/enforceMonthlyLimit');


// --- SUAS ROTAS ORIGINAIS (MANTIDAS 100%) ---
// Estas rotas continuam a funcionar como antes.
router.get('/empresa/:businessName/dados', getBusinessByName);
router.get('/empresa/:businessName/servicos', getBusinessServices);
router.get('/empresa/:businessName/horarios', getBusinessHours);
router.get('/empresa/:businessName/completo', getCompleteBusinessData);


// --- NOVAS ROTAS ADICIONADAS PARA A PÁGINA DE AGENDAMENTO ---

// Rota para o frontend (Booking.jsx) obter os dados completos da empresa usando o "slug"
// Esta rota é importante para a página de agendamento carregar as informações iniciais.
router.get('/business/:businessSlug', getCompleteBusinessData);

// Rota para buscar os horários disponíveis. O frontend passa o ID da empresa.
// Ex: GET /api/public/empresa/1/horarios-disponiveis?serviceId=3&date=2024-12-25
router.get('/empresa/:id/horarios-disponiveis', getAvailableSlots);

// Rota para o cliente criar um novo agendamento. O frontend também passa o ID.
// Ex: POST /api/public/empresa/1/agendamentos
router.post(
  '/empresa/:id/agendamentos',
  requireSubscription,
  enforceMonthlyLimit,
  createAppointment
);


module.exports = router;
