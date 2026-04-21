const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  ajouterElecteur,
  getElecteurs,
  supprimerElecteur,
  ajouterCandidat,
  getDashboard,
  getResultats,
  creerElection,
  getElections,
  getVoteLocations,
  creerPresidentCentre
} = require('../controllers/adminController');
const { authAdmin } = require('../middleware/auth');

// Connexion (pas besoin d'auth)
router.post('/login', loginAdmin);

// Routes protégées
router.get('/dashboard', authAdmin, getDashboard);
router.get('/resultats', authAdmin, getResultats);

// Gestion des électeurs
router.post('/electeurs', authAdmin, ajouterElecteur);
router.get('/electeurs', authAdmin, getElecteurs);
router.delete('/electeurs/:id', authAdmin, supprimerElecteur);

// Gestion des candidats
router.post('/candidats', authAdmin, ajouterCandidat);

// Gestion des élections
router.post('/elections', authAdmin, creerElection);
router.get('/elections', authAdmin, getElections);
router.get('/vote-locations', authAdmin, getVoteLocations);
router.post('/presidents', authAdmin, creerPresidentCentre);

module.exports = router;
