const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Electeur = sequelize.define('Electeur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le prénom est obligatoire' }
    }
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom est obligatoire' }
    }
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: 'Date de naissance invalide' },
      isOldEnough(value) {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new Error('L\'électeur doit avoir au moins 18 ans');
        }
      }
    }
  },
  adresse: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  departement: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  centre_vote: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  bureau_vote: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  numero_cni: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: { msg: 'Email invalide' }
    }
  },
  code_electoral: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  empreinte_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de l\'empreinte digitale enregistrée dans le module Arduino'
  },
  photo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  a_vote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  methode_vote: {
    type: DataTypes.ENUM('en_ligne', 'arduino'),
    allowNull: true,
    defaultValue: null,
    comment: 'Méthode utilisée pour voter'
  },
  date_vote: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'suspendu'),
    defaultValue: 'actif'
  }
}, {
  tableName: 'electeurs',
  indexes: [
    { fields: ['numero_cni'] },
    { fields: ['code_electoral'] },
    { fields: ['departement'] },
    { fields: ['centre_vote'] },
    { fields: ['bureau_vote'] }
  ]
});

module.exports = Electeur;
