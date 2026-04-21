const express = require('express');
const router = express.Router();
const { getCandidats, selectionnerCandidat, confirmerVote } = require('../controllers/voteController');
const { authElecteur } = require('../middleware/auth');

// Liste des candidats
router.get('/candidats', authElecteur, getCandidats);

// Sélectionner un candidat (envoie OTP de confirmation)
router.post('/select', authElecteur, selectionnerCandidat);

// Confirmer le vote avec OTP
router.post('/confirm', authElecteur, confirmerVote);

module.exports = router;
