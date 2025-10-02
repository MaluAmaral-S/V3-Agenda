// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    onboardingCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordResetCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

// CORREÇÃO: Usamos 'beforeSave' para que a senha seja criptografada
// tanto na criação (CREATE) quanto na atualização (UPDATE).
User.beforeSave(async (user, options) => {
  // Apenas criptografa a senha se ela foi modificada
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

module.exports = User;