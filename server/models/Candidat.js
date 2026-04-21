const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Candidat = sequelize.define('Candidat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  parti: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nom du parti politique ou coalition'
  },
  slogan: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  programme: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Résumé du programme électoral'
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  couleur: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#007B3A',
    comment: 'Couleur représentative du candidat (hex)'
  },
  numero_ordre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Numéro d\'ordre sur le bulletin de vote'
  },
  nombre_votes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('actif', 'retire', 'disqualifie'),
    defaultValue: 'actif'
  }
}, {
  tableName: 'candidats'
});

module.exports = Candidat;
