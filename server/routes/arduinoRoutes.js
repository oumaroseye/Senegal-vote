const express = require('express');
const router = express.Router();
const { 
  verifierEmpreinte, 
  enregistrerVoteArduino, 
  enregistrerEmpreinte,
  getCandidatsArduino,
  getScanStatus,
  clearScan,
  webVote,
  findByCni,
  registerAndPrepare,
  getVoteCompleteStatus,
  resetVoteStatus
} = require('../controllers/arduinoController');
const { authArduino } = require('../middleware/auth');

// ─── Routes protégées par clé API (Arduino hardware) ───
router.post('/verify-fingerprint', authArduino, verifierEmpreinte);
router.post('/vote', authArduino, enregistrerVoteArduino);
router.post('/register-fingerprint', authArduino, enregistrerEmpreinte);
router.get('/candidats', authArduino, getCandidatsArduino);
router.get('/vote-complete-status', authArduino, getVoteCompleteStatus);
router.post('/reset-vote-status', authArduino, resetVoteStatus);

// ─── Routes pont Web ↔ Arduino (accessibles depuis la page web) ───
router.get('/scan-status', getScanStatus);
router.post('/clear-scan', clearScan);
router.post('/web-vote', webVote);
router.post('/find-by-cni', findByCni);
router.post('/register-and-prepare', registerAndPrepare);

module.exports = router;
