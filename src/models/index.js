const User = require('./User');
const Service = require('./Service');
const BusinessHours = require('./BusinessHours');
const Appointment = require('./Appointment');
const Plan = require('./Plan');
const Subscription = require('./Subscription');

const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

User.hasOne(Subscription, {
  foreignKey: 'userId',
  as: 'subscription',
  onDelete: 'CASCADE',
});

Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Plan.hasMany(Subscription, {
  foreignKey: 'planId',
  as: 'subscriptions',
});

Subscription.belongsTo(Plan, {
  foreignKey: 'planId',
  as: 'plan',
});

module.exports = {
  User,
  Service,
  BusinessHours,
  Appointment,
  Plan,
  Subscription,
  sequelize,
  Sequelize,
};

