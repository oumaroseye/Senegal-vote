const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OTP = sequelize.define('OTP', {
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
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('authentification', 'confirmation_vote'),
    allowNull: false,
    comment: 'Type d\'OTP: authentification initiale ou confirmation de vote'
  },
  expire_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  utilise: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tentatives: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Nombre de tentatives de saisie'
  }
}, {
  tableName: 'otps',
  indexes: [
    { fields: ['electeur_id', 'type'] },
    { fields: ['code'] }
  ]
});

module.exports = OTP;
