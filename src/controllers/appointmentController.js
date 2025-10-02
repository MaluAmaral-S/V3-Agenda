// src/controllers/appointmentController.js
const { Appointment, User, Service, BusinessHours } = require('../models');
const { Op } = require('sequelize');

// --- SUAS FUNÇÕES AUXILIARES ORIGINAIS (MANTIDAS) ---

// Função auxiliar para converter horário em minutos
const timeToMinutes = (timeString) => {
  if (!timeString || !/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Função auxiliar para converter minutos em horário
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Função para verificar se o horário está dentro do funcionamento
const isWithinBusinessHours = (businessHours, dayOfWeek, startTime, endTime) => {
  const daySchedule = businessHours[dayOfWeek.toString()];
  
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  // Garante que 'intervals' é uma lista (array) antes de tentar usá-la.
  if (!daySchedule.intervals || !Array.isArray(daySchedule.intervals)) {
    return false;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return daySchedule.intervals.some(interval => {
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);
    return startMinutes >= intervalStart && endMinutes <= intervalEnd;
  });
};

// Função para verificar conflitos de horário (lógica de sobreposição corrigida)
const hasTimeConflict = async (userId, date, startTime, endTime, excludeAppointmentId = null) => {
  const whereClause = {
    userId,
    appointmentDate: date,
    status: ['confirmed', 'pending'],
    [Op.or]: [
      // 1. O novo agendamento começa durante um existente
      {
        appointmentTime: { [Op.lt]: startTime },
        endTime: { [Op.gt]: startTime }
      },
      // 2. O novo agendamento termina durante um existente
      {
        appointmentTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: endTime }
      },
      // 3. O novo agendamento envolve completamente um existente
      {
        appointmentTime: { [Op.gte]: startTime },
        endTime: { [Op.lte]: endTime }
      }
    ]
  };

  if (excludeAppointmentId) {
    whereClause.id = { [Op.ne]: excludeAppointmentId };
  }

  const conflictingAppointments = await Appointment.count({ where: whereClause });
  return conflictingAppointments > 0;
};

// --- SUAS FUNÇÕES DE CONTROLLER ORIGINAIS (MANTIDAS) ---

// POST /api/empresa/:id/agendamentos - Cliente solicita um novo agendamento
const createAppointment = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const {
            serviceId,
            clientName,
            clientEmail,
            clientPhone,
            appointmentDate,
            appointmentTime,
            observations
        } = req.body;

        const business = await User.findByPk(userId);
        if (!business) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        const service = await Service.findOne({ where: { id: serviceId, userId } });
        if (!service) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        const startMinutes = timeToMinutes(appointmentTime);
        const endMinutes = startMinutes + service.duracao_minutos;
        const endTime = minutesToTime(endMinutes);

        const businessHours = await BusinessHours.findOne({ where: { userId } });
        if (!businessHours) {
            return res.status(400).json({ error: 'Horários de funcionamento não configurados' });
        }

        const appointmentDateObj = new Date(appointmentDate + 'T00:00:00');
        const dayOfWeek = appointmentDateObj.getDay();

        if (!isWithinBusinessHours(businessHours.businessHours, dayOfWeek, appointmentTime, endTime)) {
            return res.status(400).json({ error: 'Horário fora do funcionamento da empresa' });
        }

        const hasConflict = await hasTimeConflict(userId, appointmentDate, appointmentTime, endTime);
        if (hasConflict) {
            return res.status(400).json({ error: 'Horário não disponível' });
        }

        const appointment = await Appointment.create({
            userId,
            serviceId,
            clientName,
            clientEmail,
            clientPhone,
            appointmentDate,
            appointmentTime,
            endTime,
            observations,
            status: 'pending'
        });

        const appointmentWithService = await Appointment.findByPk(appointment.id, {
            include: [{ model: Service, as: 'service', attributes: ['nome', 'duracao_minutos', 'preco'] }]
        });

        res.status(201).json({
            message: 'Agendamento solicitado com sucesso',
            appointment: appointmentWithService
        });

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// GET /api/empresa/:id/agendamentos - Listar agendamentos da empresa
const getAppointments = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { status, date, page = 1, limit = 10 } = req.query;

        const business = await User.findByPk(userId);
        if (!business) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        const whereClause = { userId };
        if (status) whereClause.status = status;
        if (date) whereClause.appointmentDate = date;

        const offset = (page - 1) * limit;

        const { count, rows: appointments } = await Appointment.findAndCountAll({
            where: whereClause,
            include: [{ model: Service, as: 'service', attributes: ['nome', 'duracao_minutos', 'preco'] }],
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            appointments,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// PATCH /api/agendamentos/:id/confirmar - Empresa confirma agendamento
const confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;

        const appointment = await Appointment.findOne({
            where: { id, userId },
            include: [{ model: Service, as: 'service' }]
        });

        if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });
        if (appointment.status !== 'pending') return res.status(400).json({ error: 'Agendamento não está pendente' });

        await appointment.update({ status: 'confirmed' });
        res.json({ message: 'Agendamento confirmado com sucesso', appointment });
    } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// PATCH /api/agendamentos/:id/recusar - Empresa recusa agendamento
const rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { rejectionReason } = req.body;

        const appointment = await Appointment.findOne({ where: { id, userId } });
        if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });
        if (appointment.status !== 'pending') return res.status(400).json({ error: 'Agendamento não está pendente' });

        await appointment.update({ status: 'rejected', rejectionReason });
        res.json({ message: 'Agendamento recusado com sucesso', appointment });
    } catch (error) {
        console.error('Erro ao recusar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// PATCH /api/agendamentos/:id/remarcar - Empresa sugere nova data/hora
const rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { suggestedDate, suggestedTime } = req.body;

        const appointment = await Appointment.findOne({
            where: { id, userId },
            include: [{ model: Service, as: 'service' }]
        });
        if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });
        if (appointment.status !== 'pending') return res.status(400).json({ error: 'Agendamento não está pendente' });

        const startMinutes = timeToMinutes(suggestedTime);
        const endMinutes = startMinutes + appointment.service.duracao_minutos;
        const suggestedEndTime = minutesToTime(endMinutes);

        const businessHours = await BusinessHours.findOne({ where: { userId } });
        const dayOfWeek = new Date(suggestedDate).getDay();

        if (!isWithinBusinessHours(businessHours.businessHours, dayOfWeek, suggestedTime, suggestedEndTime)) {
            return res.status(400).json({ error: 'Horário sugerido fora do funcionamento da empresa' });
        }

        const hasConflict = await hasTimeConflict(userId, suggestedDate, suggestedTime, suggestedEndTime, id);
        if (hasConflict) {
            return res.status(400).json({ error: 'Horário sugerido não disponível' });
        }

        await appointment.update({ status: 'rescheduled', suggestedDate, suggestedTime, suggestedEndTime });
        res.json({ message: 'Nova data/hora sugerida com sucesso', appointment });
    } catch (error) {
        console.error('Erro ao remarcar agendamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- FUNÇÃO GETAVAILABLESLOTS ATUALIZADA E CORRIGIDA ---

const getAvailableSlots = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { date, serviceId } = req.query;

        if (!date || !serviceId) {
            return res.status(400).json({ error: 'Data e serviço são obrigatórios' });
        }

        const [service, businessHoursRecord, user] = await Promise.all([
            Service.findOne({ where: { id: serviceId, userId } }),
            BusinessHours.findOne({ where: { userId } }),
            User.findByPk(userId)
        ]);

        if (!user) return res.status(404).json({ error: 'Empresa não encontrada' });
        if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
        if (!businessHoursRecord) return res.status(400).json({ error: 'Horários de funcionamento não configurados' });

        const dateObj = new Date(date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        const daySchedule = businessHoursRecord.businessHours[dayOfWeek.toString()];

        if (!daySchedule || !daySchedule.isOpen) {
            return res.json({ availableSlots: [] });
        }
        
        if (!daySchedule.intervals || !Array.isArray(daySchedule.intervals)) {
            return res.json({ availableSlots: [] });
        }

        const existingAppointments = await Appointment.findAll({
            where: {
                userId,
                appointmentDate: date,
                status: ['pending', 'confirmed'] // Apenas agendamentos pendentes ou confirmados bloqueiam horários
            }
        });

        const bookedSlots = existingAppointments.map(app => {
            const start = timeToMinutes(app.appointmentTime);
            // Usa o `endTime` já calculado e salvo no banco de dados para consistência
            const end = timeToMinutes(app.endTime);
            return { start, end };
        });

        const availableSlots = [];
        const serviceDuration = service.duracao_minutos;
        const now = new Date();
        // Corrige a comparação para considerar o fuso horário local
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isToday = dateObj.getTime() === today.getTime();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const slotIncrement = 15; // Define o incremento dos slots, pode ser ajustado

        for (const interval of daySchedule.intervals) {
            let potentialStartMinutes = timeToMinutes(interval.start);
            const intervalEndMinutes = timeToMinutes(interval.end);

            while (potentialStartMinutes <= intervalEndMinutes) {
                const potentialEndMinutes = potentialStartMinutes + serviceDuration;

                // 1. O slot termina depois do fim do expediente de trabalho?
                if (potentialEndMinutes > intervalEndMinutes) {
                    break; // Não cabem mais slots deste serviço neste intervalo
                }

                // 2. O horário já passou (se for hoje)?
                if (isToday && potentialStartMinutes < currentMinutes) {
                    potentialStartMinutes += slotIncrement;
                    continue;
                }

                // 3. Há conflito com agendamentos existentes?
                const hasConflict = bookedSlots.some(booked =>
                    (potentialStartMinutes < booked.end && potentialEndMinutes > booked.start)
                );

                if (!hasConflict) {
                    availableSlots.push({ startTime: minutesToTime(potentialStartMinutes) });
                }
                
                // Avança para o próximo slot potencial
                potentialStartMinutes += slotIncrement;
            }
        }

        res.json({ availableSlots });

    } catch (error) {
        console.error('Erro ao buscar horários disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// --- NOVAS FUNÇÕES PÚBLICAS PARA CLIENTES ---

// GET /api/empresa/:id/agendamentos-cliente
// Lista os agendamentos de um cliente a partir do email e telefone. Não requer autenticação.
const getClientAppointments = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { email, phone } = req.query;
        if (!email || !phone) {
            return res.status(400).json({ error: 'Email e telefone são obrigatórios' });
        }

        // Busca somente agendamentos que correspondem aos dados do cliente
        const appointments = await Appointment.findAll({
            where: {
                userId,
                clientEmail: email,
                clientPhone: phone
            },
            include: [
                { model: Service, as: 'service', attributes: ['nome', 'duracao_minutos', 'preco'] }
            ],
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        return res.json({ appointments });
    } catch (error) {
        console.error('Erro ao buscar agendamentos do cliente:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// DELETE /api/agendamentos/:id?email=&phone=
// Permite ao cliente cancelar um agendamento. Valida email e telefone para garantir que o cliente é o dono.
const cancelAppointmentByClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone } = req.query;
        if (!email || !phone) {
            return res.status(400).json({ error: 'Email e telefone são obrigatórios' });
        }

        const appointment = await Appointment.findByPk(id, {
            include: [{ model: Service, as: 'service' }]
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        // Verifica se os dados do cliente correspondem
        if (appointment.clientEmail !== email || appointment.clientPhone !== phone) {
            return res.status(403).json({ error: 'Credenciais inválidas para cancelar este agendamento' });
        }
        // Atualiza status para 'rejected' para representar cancelamento
        await appointment.update({ status: 'rejected' });
        return res.json({ message: 'Agendamento cancelado com sucesso', appointment });
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// PATCH /api/agendamentos/:id/solicitar-remarcacao
// Permite ao cliente solicitar uma remarcação informando nova data/horário. Valida email e telefone.
const requestRescheduleByClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone, suggestedDate, suggestedTime } = req.body;
        if (!email || !phone || !suggestedDate || !suggestedTime) {
            return res.status(400).json({ error: 'Email, telefone, data e horário sugeridos são obrigatórios' });
        }

        const appointment = await Appointment.findByPk(id, {
            include: [{ model: Service, as: 'service' }]
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        // Garante que o cliente é o dono do agendamento
        if (appointment.clientEmail !== email || appointment.clientPhone !== phone) {
            return res.status(403).json({ error: 'Credenciais inválidas para remarcar este agendamento' });
        }
        // Calcula hora de término baseada na duração do serviço
        const startMinutes = timeToMinutes(suggestedTime);
        const endMinutes = startMinutes + appointment.service.duracao_minutos;
        const suggestedEndTime = minutesToTime(endMinutes);

        const userId = appointment.userId;
        const businessHours = await BusinessHours.findOne({ where: { userId } });
        if (!businessHours) {
            return res.status(400).json({ error: 'Horários de funcionamento não configurados' });
        }
        const dayOfWeek = new Date(suggestedDate).getDay();
        if (!isWithinBusinessHours(businessHours.businessHours, dayOfWeek, suggestedTime, suggestedEndTime)) {
            return res.status(400).json({ error: 'Horário sugerido fora do funcionamento da empresa' });
        }
        // Verifica conflito com outros agendamentos (excluindo o próprio agendamento)
        const hasConflict = await hasTimeConflict(userId, suggestedDate, suggestedTime, suggestedEndTime, id);
        if (hasConflict) {
            return res.status(400).json({ error: 'Horário sugerido não disponível' });
        }
        // Atualiza dados de remarcação
        await appointment.update({
            status: 'rescheduled',
            suggestedDate,
            suggestedTime,
            suggestedEndTime
        });
        return res.json({ message: 'Solicitação de remarcação enviada com sucesso', appointment });
    } catch (error) {
        console.error('Erro ao solicitar remarcação:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    confirmAppointment,
    rejectAppointment,
    rescheduleAppointment,
    getAvailableSlots,
    // Exporta rotas públicas adicionadas
    getClientAppointments,
    cancelAppointmentByClient,
    requestRescheduleByClient,
};