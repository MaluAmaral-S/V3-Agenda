const express = require('express');
const router = express.Router();
const { User, Service, BusinessHours } = require("../models/index");
const { Op } = require("sequelize");

// Buscar dados da empresa por slug
router.get('/business/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Buscar empresa pelo slug (baseado no nome da empresa)
    const business = await User.findOne({
      where: {
        businessName: {
          [Op.iLike]: slug.replace(/-/g, " ")
        }
      },
      attributes: ['id', 'name', 'businessName', 'email', 'phone']
    });

    if (!business) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Buscar serviços da empresa
    const services = await Service.findAll({
      where: { userId: business.id },
      attributes: ['id', 'nome', 'descricao', 'duracao_minutos', 'preco']
    });

    // Buscar horários de funcionamento
    const businessHours = await BusinessHours.findOne({
      where: { userId: business.id }
    });

    res.json({
      business: {
        id: business.id,
        name: business.businessName,
        slug: business.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        email: business.email,
        phone: business.phone
      },
      services,
      businessHours: businessHours ? businessHours.businessHours : {}
    });

  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar agendamento público
router.post('/booking', async (req, res) => {
  try {
    const { businessSlug, serviceId, date, time, clientData } = req.body;

    // Validar dados obrigatórios
    if (!businessSlug || !serviceId || !date || !time || !clientData.nome || !clientData.telefone) {
      return res.status(400).json({ message: 'Dados obrigatórios não fornecidos' });
    }

    // Buscar empresa pelo slug
    const business = await User.findOne({
      where: {
        businessName: {
          [require('sequelize').Op.iLike]: businessSlug.replace(/-/g, ' ')
        }
      }
    });

    if (!business) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Buscar serviço
    const service = await Service.findOne({
      where: { 
        id: serviceId,
        userId: business.id 
      }
    });

    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Aqui você implementaria a lógica para salvar o agendamento
    // Por enquanto, vamos apenas simular o sucesso
    const bookingData = {
      id: Date.now(), // ID temporário
      businessId: business.id,
      serviceId: service.id,
      serviceName: service.nome,
      date,
      time,
      clientName: clientData.nome,
      clientPhone: clientData.telefone,
      clientEmail: clientData.email || null,
      status: 'confirmed',
      createdAt: new Date()
    };

    console.log('Agendamento criado:', bookingData);

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      booking: bookingData
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;

