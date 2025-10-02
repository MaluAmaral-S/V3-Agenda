// src/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  confirmAppointment,
  rejectAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  // Novas ações públicas para clientes
  getClientAppointments,
  cancelAppointmentByClient,
  requestRescheduleByClient,
} = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const requireSubscription = require('../middleware/requireSubscription');
const enforceMonthlyLimit = require('../middleware/enforceMonthlyLimit');

// Rotas públicas (para clientes)
router.post(
  '/empresa/:id/agendamentos',
  requireSubscription,
  enforceMonthlyLimit,
  createAppointment
);
router.get('/empresa/:id/horarios-disponiveis', getAvailableSlots);

// Rotas públicas adicionais para clientes consultarem, cancelarem ou solicitarem remarcação de seus agendamentos
// Buscar agendamentos de um cliente específico por email e telefone
router.get('/empresa/:id/agendamentos-cliente', getClientAppointments);

// Cancelar um agendamento como cliente. Exige email e telefone via querystring para validação.
router.delete('/agendamentos/:id', cancelAppointmentByClient);

// Solicitar remarcação de um agendamento pelo cliente. Verifica email/telefone e aplica lógica de remarcação no controlador.
router.patch('/agendamentos/:id/solicitar-remarcacao', requestRescheduleByClient);

// Rotas protegidas (para empresas)
router.get('/empresa/:id/agendamentos', authenticateToken, getAppointments);
router.patch('/agendamentos/:id/confirmar', authenticateToken, confirmAppointment);
router.patch('/agendamentos/:id/recusar', authenticateToken, rejectAppointment);
router.patch('/agendamentos/:id/remarcar', authenticateToken, rescheduleAppointment);

module.exports = router;
