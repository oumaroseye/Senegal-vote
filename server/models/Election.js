const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Election = sequelize.define('Election', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('presidentielle', 'legislative', 'locale'),
    allowNull: false,
    defaultValue: 'presidentielle'
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('a_venir', 'en_cours', 'terminee', 'annulee'),
    defaultValue: 'a_venir'
  },
  total_inscrits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_votants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'elections'
});

module.exports = Election;
