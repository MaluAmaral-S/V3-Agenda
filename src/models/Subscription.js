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
    allowNull: true,
  },
  /**
   * Identifier of the plan on Mercado Pago. When a subscription is created
   * against a Mercado Pago plan we store the remote id here. For subscriptions
   * created without an associated plan this field remains null.
   */
  mpPlanId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  /**
   * Identifier of the subscription on Mercado Pago. We use this id to fetch
   * subscription details and process webhooks.
   */
  mpSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  /**
   * Snapshot of the plan information presented to the customer at checkout.
   * This is useful when the subscription was created without a persisted plan
   * record or when plan details change over time.
   */
  planName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  planAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  planCurrency: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  planFrequency: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  planFrequencyType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'active_until_end_of_cycle', 'canceled'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['planId'] },
    { fields: ['mpSubscriptionId'] },
  ],
});

module.exports = Subscription;
