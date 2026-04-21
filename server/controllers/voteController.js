const { sequelize } = require('../config/database');
const Electeur = require('../models/Electeur');
const Candidat = require('../models/Candidat');
const Vote = require('../models/Vote');
const { generateVoteHash } = require('../utils/generateOTP');
const { sendEmail, emailVoteConfirmationTemplate } = require('../utils/sendEmail');
const { getElectionWindowStatus } = require('../utils/electionWindow');

/**
 * Récupérer la liste des candidats
 * GET /api/vote/candidats
 */
const getCandidats = async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED',
        data: electionStatus
      });
    }

    const candidats = await Candidat.findAll({
      where: { statut: 'actif' },
      order: [['numero_ordre', 'ASC']],
      attributes: ['id', 'prenom', 'nom', 'parti', 'slogan', 'photo_url', 'couleur', 'numero_ordre']
    });

    res.json({
      success: true,
      data: candidats
    });
  } catch (error) {
    console.error('Erreur récupération candidats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const enregistrerVote = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED',
        data: electionStatus
      });
    }

    const { candidat_id } = req.body;
    const electeurId = req.electeur.id;
    const isVoteBlanc = candidat_id === null || candidat_id === 'blanc';

    // Vérifier l'électeur (verrouillage ligne pour éviter vote simultané en ligne/Arduino)
    const electeur = await Electeur.findByPk(electeurId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!electeur || electeur.a_vote) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Vote non autorisé ou déjà effectué.'
      });
    }

    // Vérifier le candidat (sauf vote blanc)
    let candidat = null;
    if (!isVoteBlanc) {
      candidat = await Candidat.findByPk(candidat_id, { transaction });
      if (!candidat || candidat.statut !== 'actif') {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Candidat invalide.'
        });
      }
    }

    // Enregistrer le vote (sans second OTP)
    const voteHash = generateVoteHash(electeurId, isVoteBlanc ? 'blanc' : candidat_id, Date.now());

    await Vote.create({
      electeur_id: electeurId,
      candidat_id: isVoteBlanc ? null : candidat_id,
      methode: 'en_ligne',
      ip_address: req.ip,
      departement_vote: electeur.departement,
      centre_vote: electeur.centre_vote,
      bureau_vote: electeur.bureau_vote,
      hash_vote: voteHash,
      date_vote: new Date()
    }, { transaction });

    // Mettre à jour l'électeur
    electeur.a_vote = true;
    electeur.methode_vote = 'en_ligne';
    electeur.date_vote = new Date();
    await electeur.save({ transaction });

    // Incrémenter le compteur du candidat (sauf vote blanc)
    if (!isVoteBlanc && candidat) {
      candidat.nombre_votes += 1;
      await candidat.save({ transaction });
    }

    await transaction.commit();

    // Envoyer email de confirmation de vote (en arrière-plan, ne bloque pas la réponse)
    if (electeur.email) {
      const dateFormatee = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      sendEmail(
        electeur.email,
        'Confirmation de votre vote - Sénégal Vote',
        emailVoteConfirmationTemplate(
          electeur.prenom,
          dateFormatee,
          voteHash
        )
      ).catch(err => console.error('Erreur envoi email confirmation vote:', err));
    }

    res.json({
      success: true,
      message: 'Vote confirmé avec succès.',
      data: {
        hash_vote: voteHash,
        date_vote: new Date().toISOString()
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur enregistrement vote:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Étape 1: Sélection du candidat (confirmation automatique)
 * POST /api/vote/select
 */
const selectionnerCandidat = async (req, res) => {
  return enregistrerVote(req, res);
};

/**
 * Compatibilité: route historique de confirmation
 * POST /api/vote/confirm
 */
const confirmerVote = async (req, res) => {
  return enregistrerVote(req, res);
};

module.exports = { getCandidats, selectionnerCandidat, confirmerVote };
