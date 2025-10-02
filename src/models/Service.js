// src/models/Service.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Importa o modelo User

const Service = sequelize.define('Service', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  duracao_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
});

// Define a relação: Um serviço pertence a um usuário (empresa)
Service.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Define a relação inversa: Um usuário (empresa) pode ter muitos serviços
User.hasMany(Service, {
  foreignKey: 'userId',
  as: 'services'
});

module.exports = Service;