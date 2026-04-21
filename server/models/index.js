const { sequelize } = require('../config/database');
const Electeur = require('./Electeur');
const Candidat = require('./Candidat');
const Vote = require('./Vote');
const OTP = require('./OTP');
const Election = require('./Election');
const Admin = require('./Admin');

// ==================== ASSOCIATIONS ====================

// Un électeur peut avoir un vote
Electeur.hasOne(Vote, { foreignKey: 'electeur_id', as: 'vote' });
Vote.belongsTo(Electeur, { foreignKey: 'electeur_id', as: 'electeur' });

// Un candidat peut avoir plusieurs votes
Candidat.hasMany(Vote, { foreignKey: 'candidat_id', as: 'votes' });
Vote.belongsTo(Candidat, { foreignKey: 'candidat_id', as: 'candidat' });

// Un électeur peut avoir plusieurs OTPs
Electeur.hasMany(OTP, { foreignKey: 'electeur_id', as: 'otps' });
OTP.belongsTo(Electeur, { foreignKey: 'electeur_id', as: 'electeur' });

// Une élection a plusieurs candidats
Election.hasMany(Candidat, { foreignKey: 'election_id', as: 'candidats' });
Candidat.belongsTo(Election, { foreignKey: 'election_id', as: 'election' });

module.exports = {
  sequelize,
  Electeur,
  Candidat,
  Vote,
  OTP,
  Election,
  Admin
};
