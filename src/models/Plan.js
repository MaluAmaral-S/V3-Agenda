const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  monthlyLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  /**
   * Identifier of the corresponding plan on Mercado Pago.  When an
   * administrator creates a plan using the Mercado Pago API we store the
   * returned id here so that subscriptions can reference it.  This field
   * remains null for plans that have not been synchronized with Mercado Pago.
   */
  mpPlanId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  frequency: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  frequencyType: {
    type: DataTypes.STRING, // 'days' or 'months'
    allowNull: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['key'] },
    { fields: ['isActive'] },
  ],
});

module.exports = Plan;
