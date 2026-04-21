/**
 * Génère un code OTP à 6 chiffres
 * @returns {string} Code OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Génère un code électoral unique
 * Format: SN-XXXXX-XXXX (SN = Sénégal)
 * @returns {string} Code électoral
 */
const generateCodeElectoral = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SN-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Génère un hash unique pour un vote
 */
const crypto = require('crypto');
const generateVoteHash = (electeurId, candidatId, timestamp) => {
  const data = `${electeurId}-${candidatId}-${timestamp}-${Math.random()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = { generateOTP, generateCodeElectoral, generateVoteHash };
