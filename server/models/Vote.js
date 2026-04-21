const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  electeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'electeurs',
      key: 'id'
    }
  },
  candidat_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'candidats',
      key: 'id'
    },
    comment: 'NULL = vote blanc / bulletin nul'
  },
  methode: {
    type: DataTypes.ENUM('en_ligne', 'arduino'),
    allowNull: false,
    comment: 'Méthode de vote utilisée'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Adresse IP pour les votes en ligne'
  },
  device_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Identifiant du dispositif Arduino'
  },
  departement_vote: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  centre_vote: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  bureau_vote: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  hash_vote: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Hash unique pour garantir l\'intégrité du vote'
  },
  date_vote: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'votes',
  indexes: [
    { unique: true, fields: ['electeur_id'] },
    { fields: ['candidat_id'] },
    { fields: ['methode'] },
    { fields: ['departement_vote'] },
    { fields: ['centre_vote'] },
    { fields: ['bureau_vote'] }
  ]
});

module.exports = Vote;
