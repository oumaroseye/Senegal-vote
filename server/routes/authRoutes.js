const express = require('express');
const router = express.Router();
const { verifierIdentite, envoyerOTP, verifierOTP, renvoyerOTP } = require('../controllers/authController');
const { authElecteur } = require('../middleware/auth');

// Étape 1: Vérification CNI + code électoral
router.post('/verify', verifierIdentite);

// Étape 2: L'électeur saisit son email → OTP envoyé
router.post('/send-otp', authElecteur, envoyerOTP);

// Étape 3: Vérification OTP (nécessite le token temporaire)
router.post('/verify-otp', authElecteur, verifierOTP);

// Renvoyer OTP
router.post('/resend-otp', authElecteur, renvoyerOTP);

module.exports = router;
