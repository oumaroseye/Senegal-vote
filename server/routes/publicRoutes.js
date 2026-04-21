const express = require('express');
const router = express.Router();
const Candidat = require('../models/Candidat');
const Vote = require('../models/Vote');
const Electeur = require('../models/Electeur');
const { sequelize } = require('../config/database');
const { getElectionWindowStatus } = require('../utils/electionWindow');

/**
 * Statut public de l'élection (pour chrono frontend)
 * GET /api/public/election-status
 */
router.get('/election-status', async (req, res) => {
  try {
    const status = await getElectionWindowStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

/**
 * Liste publique des candidats (toujours visible)
 * GET /api/public/candidats
 */
router.get('/candidats', async (req, res) => {
  try {
    const candidats = await Candidat.findAll({
      where: { statut: 'actif' },
      attributes: ['id', 'prenom', 'nom', 'parti', 'couleur', 'photo_url', 'programme', 'slogan', 'numero_ordre'],
      order: [['numero_ordre', 'ASC'], ['nom', 'ASC']]
    });

    res.json({
      success: true,
      data: candidats
    });
  } catch (error) {
    console.error('Erreur candidats publics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

/**
 * Résultats publics (après clôture)
 * GET /api/public/resultats
 */
router.get('/resultats', async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canShowResults) {
      return res.status(403).json({
        success: false,
        code: 'RESULTS_HIDDEN',
        message: 'Les résultats seront disponibles après la fin du vote.',
        data: electionStatus
      });
    }

    const totalVotes = await Vote.count();
    const votesEnLigne = await Vote.count({ where: { methode: 'en_ligne' } });
    const votesArduino = await Vote.count({ where: { methode: 'arduino' } });
    const totalElecteurs = await Electeur.count({ where: { statut: 'actif' } });
    const votesBlancs = await Vote.count({ where: { candidat_id: null } });

    const resultats = await Candidat.findAll({
      where: { statut: 'actif' },
      attributes: [
        'id', 'prenom', 'nom', 'parti', 'couleur', 'photo_url', 'nombre_votes', 'numero_ordre',
        [sequelize.literal(
          totalVotes > 0 
            ? `ROUND((nombre_votes / ${totalVotes}) * 100, 2)` 
            : '0'
        ), 'pourcentage']
      ],
      order: [['nombre_votes', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total_votes: totalVotes,
        votes_en_ligne: votesEnLigne,
        votes_arduino: votesArduino,
        total_electeurs: totalElecteurs,
        votes_blancs: votesBlancs,
        taux_participation: totalElecteurs > 0 ? ((totalVotes / totalElecteurs) * 100).toFixed(2) : 0,
        resultats
      }
    });
  } catch (error) {
    console.error('Erreur résultats publics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

/**
 * Statistiques publiques
 * GET /api/public/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canShowResults) {
      return res.status(403).json({
        success: false,
        code: 'RESULTS_HIDDEN',
        message: 'Les statistiques seront disponibles après la fin du vote.',
        data: electionStatus
      });
    }

    const totalElecteurs = await Electeur.count({ where: { statut: 'actif' } });
    const totalVotants = await Vote.count();
    const totalCandidats = await Candidat.count({ where: { statut: 'actif' } });

    res.json({
      success: true,
      data: {
        total_electeurs: totalElecteurs,
        total_votants: totalVotants,
        total_candidats: totalCandidats,
        taux_participation: totalElecteurs > 0 ? ((totalVotants / totalElecteurs) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
