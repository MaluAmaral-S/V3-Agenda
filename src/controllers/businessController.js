// src/controllers/businessController.js
const { User, Service, BusinessHours, Appointment } = require('../models');
const { Op, fn, col } = require('sequelize');

// GET /api/empresa/:businessName/dados - Obter dados públicos da empresa
const getBusinessByName = async (req, res) => {
  try {
    const { businessName } = req.params;
    console.log('Buscando empresa:', businessName);
    console.log('Decodificado:', decodeURIComponent(businessName));
    console.log('Com espaços:', decodeURIComponent(businessName).replace(/-/g, ' '));

    // Buscar empresa pelo nome do negócio (businessName)
    const searchName = decodeURIComponent(businessName).replace(/-/g, ' ');
    console.log('Termo de busca final:', searchName);
    
    const business = await User.findOne({
      where: {
        businessName: {
          [Op.iLike]: `%${searchName}%`
        }
      },
      attributes: ['id', 'name', 'businessName', 'businessType', 'email', 'phone']
    });

    console.log('Empresa encontrada:', business);

    if (!business) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({
      data: business
    });

  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/empresa/:businessName/servicos - Obter serviços públicos da empresa
const getBusinessServices = async (req, res) => {
  try {
    const { businessName } = req.params;

    // Buscar empresa pelo nome do negócio
    const searchName = decodeURIComponent(businessName).replace(/-/g, ' ').toLowerCase();
    const business = await User.findOne({
      where: {
        businessName: {
          [Op.iLike]: searchName
        }
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Buscar serviços da empresa
    const services = await Service.findAll({
      where: { userId: business.id },
      attributes: ['id', 'nome', 'descricao', 'duracao_minutos', 'preco'],
      order: [['nome', 'ASC']]
    });

    res.json({
      data: services
    });

  } catch (error) {
    console.error('Erro ao buscar serviços da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/empresa/:businessName/horarios - Obter horários de funcionamento públicos
const getBusinessHours = async (req, res) => {
  try {
    const { businessName } = req.params;

    // Buscar empresa pelo nome do negócio
    const searchName = decodeURIComponent(businessName).replace(/-/g, ' ').toLowerCase();
    const business = await User.findOne({
      where: {
        businessName: {
          [Op.iLike]: searchName
        }
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Buscar horários de funcionamento
    const businessHours = await BusinessHours.findOne({
      where: { userId: business.id }
    });

    res.json({
      data: businessHours ? businessHours.businessHours : {}
    });

  } catch (error) {
    console.error('Erro ao buscar horários da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/empresa/:businessName/completo - Obter todos os dados públicos da empresa
// src/controllers/businessController.js

const getCompleteBusinessData = async (req, res) => {
  try {
    const { businessSlug } = req.params; // <-- CORREÇÃO: Usar businessSlug

    // Buscar empresa pelo nome do negócio
    const business = await User.findOne({
      where: {
        businessName: { // O nome do campo no banco de dados continua o mesmo
          [Op.iLike]: decodeURIComponent(businessSlug).replace(/-/g, ' ').toLowerCase() // <-- CORREÇÃO: Usar a variável correta
        }
      },
      attributes: ['id', 'name', 'businessName', 'businessType', 'email', 'phone']
    });

    if (!business) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Buscar serviços da empresa
    const services = await Service.findAll({
      where: { userId: business.id },
      attributes: ['id', 'nome', 'descricao', 'duracao_minutos', 'preco'],
      order: [['nome', 'ASC']]
    });

    // Buscar horários de funcionamento
    const businessHours = await BusinessHours.findOne({
      where: { userId: business.id }
    });

    res.json({
      business,
      services,
      businessHours: businessHours ? businessHours.businessHours : {}
    });

  } catch (error) {
    console.error('Erro ao buscar dados completos da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.user;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Today's Bookings
    const todayBookings = await Appointment.count({
      where: {
        userId,
        appointmentDate: {
          [Op.gte]: startOfToday,
          [Op.lt]: endOfToday,
        },
        status: { [Op.in]: ['confirmed', 'pending'] },
      },
    });

    // 2. Month's Bookings
    const monthBookings = await Appointment.count({
      where: {
        userId,
        appointmentDate: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        status: { [Op.in]: ['confirmed', 'pending'] },
      },
    });

    // 3. Active Services
    const activeServices = await Service.count({
      where: { userId },
    });

    // 4. Monthly Revenue
    const monthlyRevenueResult = await Appointment.findOne({
      attributes: [
        [fn('SUM', col('service.preco')), 'totalRevenue'],
      ],
      include: [{
        model: Service,
        as: 'service',
        attributes: [],
      }],
      where: {
        userId,
        appointmentDate: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
        status: 'confirmed',
      },
      group: ['Appointment.userId'],
      raw: true,
    });
    
    const monthlyRevenue = monthlyRevenueResult ? parseFloat(monthlyRevenueResult.totalRevenue) : 0;

    res.json({
      todayBookings,
      monthBookings,
      activeServices,
      monthlyRevenue,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getBusinessByName,
  getBusinessServices,
  getBusinessHours,
  getCompleteBusinessData,
  getDashboardStats
};