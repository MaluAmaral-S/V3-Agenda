// src/models/BusinessHours.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const BusinessHours = sequelize.define('BusinessHours', {
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
  // Use JSONB no Postgres para query e validações melhores
  businessHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      "0": { isOpen: false, intervals: [] }, // Domingo
      "1": { isOpen: true,  intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      "2": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
      "3": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
      "4": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
      "5": { isOpen: true,  intervals: [{ start: '08:00', end: '18:00' }] },
      "6": { isOpen: true,  intervals: [{ start: '09:00', end: '13:00' }] }
    }
  }
}, { timestamps: true });

BusinessHours.belongsTo(User, { foreignKey: 'userId' });
module.exports = BusinessHours;
