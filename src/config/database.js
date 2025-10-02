// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg = require('pg');

// Forçar o node-postgres a retornar o tipo DATE como string em vez de objeto Date.
// Isso evita problemas de conversão de fuso horário. OID 1082 é o código para o tipo DATE.
pg.types.setTypeParser(1082, (val) => val);

// Configuração para SQLite (para testes) ou PostgreSQL (para produção)
const dialect = process.env.DB_DIALECT || 'postgres';

let sequelize;

if (dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_NAME || 'agendamentos_db.sqlite',
    logging: false
  });
} else {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false
  });
}

module.exports = sequelize;
