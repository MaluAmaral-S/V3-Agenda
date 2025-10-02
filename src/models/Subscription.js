const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'canceled'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['planId'] },
  ],
});

module.exports = Subscription;
