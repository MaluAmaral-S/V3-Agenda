// src/models/Appointment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Service = require('./Service');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Service, key: 'id' }
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  clientPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'rescheduled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Campos para reagendamento
  suggestedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  suggestedTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  suggestedEndTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, { 
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'appointmentDate', 'appointmentTime']
    },
    {
      fields: ['status']
    }
  ]
});

// Definindo as relações
Appointment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'business'
});

Appointment.belongsTo(Service, {
  foreignKey: 'serviceId',
  as: 'service'
});

User.hasMany(Appointment, {
  foreignKey: 'userId',
  as: 'appointments'
});

Service.hasMany(Appointment, {
  foreignKey: 'serviceId',
  as: 'appointments'
});

module.exports = Appointment;

