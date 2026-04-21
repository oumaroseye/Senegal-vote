const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const Electeur = require('../models/Electeur');
const Candidat = require('../models/Candidat');
const Vote = require('../models/Vote');
const { generateVoteHash } = require('../utils/generateOTP');
const { getElectionWindowStatus } = require('../utils/electionWindow');
// Pas d'envoi d'email pour le vote Arduino (électeurs potentiellement analphabètes)

// ─── Stockage temporaire en mémoire pour le pont Arduino ↔ Web ───
let pendingScan = null;   // Dernier scan d'empreinte en attente
let scanTimestamp = null;  // Horodatage du scan
let voteCompleted = false; // Flag pour notifier l'ESP32 que le vote est terminé

/** Après saisie du CNI sur /vote-arduino : on attend ce même électeur au scan (évite empreinte d'un autre) */
let webSessionElecteurId = null;
let webSessionAt = null;
const WEB_CNI_SESSION_MS = 3 * 60 * 1000;

const clearWebCniSession = () => {
  webSessionElecteurId = null;
  webSessionAt = null;
};

const getActiveWebElecteurId = () => {
  if (webSessionElecteurId == null || webSessionAt == null) return null;
  if (Date.now() - webSessionAt > WEB_CNI_SESSION_MS) {
    clearWebCniSession();
    return null;
  }
  return webSessionElecteurId;
};

/**
 * Vérifier un électeur par empreinte digitale
 * POST /api/arduino/verify-fingerprint
 * Headers: X-API-Key: arduino_secure_key_2025
 */
const verifierEmpreinte = async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED'
      });
    }

    const { empreinte_id, device_id } = req.body;

    if (!empreinte_id) {
      return res.status(400).json({
        success: false,
        message: 'ID empreinte requis.'
      });
    }

    const expectedWebElecteurId = getActiveWebElecteurId();

    const electeur = await Electeur.findOne({
      where: { empreinte_id, statut: 'actif' }
    });

    if (!electeur) {
      // Empreinte nouvelle: on la met en attente pour association via CNI sur /vote-arduino
      pendingScan = {
        electeur_id: null,
        prenom: null,
        nom: null,
        empreinte_id: empreinte_id.toString(),
        is_new: true
      };
      scanTimestamp = Date.now();
      voteCompleted = false;

      return res.json({
        success: true,
        message: 'Empreinte reçue. Association CNI en attente.',
        code: 'EMPREINTE_A_ASSOCIER',
        data: {
          empreinte_id: empreinte_id.toString(),
          is_new: true
        }
      });
    }

    if (electeur.a_vote) {
      pendingScan = null;
      scanTimestamp = null;
      return res.status(403).json({
        success: false,
        message: 'Cet électeur a déjà voté.',
        code: 'DEJA_VOTE'
      });
    }

    // CNI déjà saisi sur le site : l'empreinte doit être celle du MÊME électeur
    if (expectedWebElecteurId != null && electeur.id !== expectedWebElecteurId) {
      pendingScan = null;
      scanTimestamp = null;
      return res.status(403).json({
        success: false,
        message: 'Cette empreinte ne correspond pas au CNI saisi sur le site. Reposez le bon doigt ou effacez le scan (bouton du site).',
        code: 'WRONG_FINGER_FOR_CNI'
      });
    }

    // Stocker le scan en mémoire pour le pont web
    pendingScan = {
      electeur_id: electeur.id,
      prenom: electeur.prenom,
      nom: electeur.nom,
      empreinte_id: empreinte_id.toString()
    };
    scanTimestamp = Date.now();
    voteCompleted = false;

    res.json({
      success: true,
      message: 'Électeur identifié.',
      data: {
        electeur_id: electeur.id,
        prenom: electeur.prenom,
        nom: electeur.nom,
        departement: electeur.departement,
        centre_vote: electeur.centre_vote,
        bureau_vote: electeur.bureau_vote,
        a_vote: electeur.a_vote
      }
    });

  } catch (error) {
    console.error('Erreur vérification empreinte:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Enregistrer un vote depuis Arduino
 * POST /api/arduino/vote
 * Headers: X-API-Key: arduino_secure_key_2025
 */
const enregistrerVoteArduino = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { empreinte_id, candidat_id, device_id } = req.body;

    // Validation
    if (!empreinte_id || !candidat_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Empreinte ID et candidat ID requis.'
      });
    }

    // Vérifier l'électeur
    const electeur = await Electeur.findOne({
      where: { empreinte_id, statut: 'actif' },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!electeur) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Empreinte non reconnue.',
        code: 'EMPREINTE_INCONNUE'
      });
    }

    if (electeur.a_vote) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cet électeur a déjà voté.',
        code: 'DEJA_VOTE'
      });
    }

    // Vérifier le candidat
    const candidat = await Candidat.findByPk(candidat_id, { transaction });
    if (!candidat || candidat.statut !== 'actif') {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidat invalide.'
      });
    }

    // Enregistrer le vote
    const voteHash = generateVoteHash(electeur.id, candidat_id, Date.now());

    await Vote.create({
      electeur_id: electeur.id,
      candidat_id,
      methode: 'arduino',
      device_id: device_id || 'ARDUINO_01',
      departement_vote: electeur.departement,
      centre_vote: electeur.centre_vote,
      bureau_vote: electeur.bureau_vote,
      hash_vote: voteHash,
      date_vote: new Date()
    }, { transaction });

    // Mettre à jour l'électeur
    electeur.a_vote = true;
    electeur.methode_vote = 'arduino';
    electeur.date_vote = new Date();
    await electeur.save({ transaction });

    // Incrémenter le compteur
    candidat.nombre_votes += 1;
    await candidat.save({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Vote enregistré avec succès.',
      code: 'VOTE_OK',
      data: {
        electeur: `${electeur.prenom} ${electeur.nom}`,
        departement: electeur.departement,
        centre_vote: electeur.centre_vote,
        bureau_vote: electeur.bureau_vote,
        candidat: `${candidat.prenom} ${candidat.nom}`,
        hash_vote: voteHash
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur vote Arduino:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Enregistrer une empreinte pour un électeur
 * POST /api/arduino/register-fingerprint
 */
const enregistrerEmpreinte = async (req, res) => {
  try {
    const { electeur_id, empreinte_id } = req.body;

    if (!electeur_id || !empreinte_id) {
      return res.status(400).json({
        success: false,
        message: 'ID électeur et ID empreinte requis.'
      });
    }

    const electeur = await Electeur.findByPk(electeur_id);
    if (!electeur) {
      return res.status(404).json({
        success: false,
        message: 'Électeur non trouvé.'
      });
    }

    // Vérifier que l'empreinte ID n'est pas déjà utilisée
    const existant = await Electeur.findOne({ where: { empreinte_id } });
    if (existant) {
      return res.status(409).json({
        success: false,
        message: 'Cette empreinte est déjà associée à un autre électeur.'
      });
    }

    electeur.empreinte_id = empreinte_id;
    await electeur.save();

    res.json({
      success: true,
      message: 'Empreinte enregistrée avec succès.',
      data: {
        electeur: `${electeur.prenom} ${electeur.nom}`,
        empreinte_id
      }
    });

  } catch (error) {
    console.error('Erreur enregistrement empreinte:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Récupérer les candidats (pour affichage Arduino)
 * GET /api/arduino/candidats
 */
const getCandidatsArduino = async (req, res) => {
  try {
    const candidats = await Candidat.findAll({
      where: { statut: 'actif' },
      order: [['numero_ordre', 'ASC']],
      attributes: ['id', 'prenom', 'nom', 'parti', 'numero_ordre']
    });

    res.json({
      success: true,
      data: candidats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ══════════════════════════════════════════════════════════════
//  PONT WEB ↔ ARDUINO : Endpoints pour la page /vote-arduino
// ══════════════════════════════════════════════════════════════

/**
 * Vérifier s'il y a un scan d'empreinte en attente
 * GET /api/arduino/scan-status
 */
const getScanStatus = async (req, res) => {
  try {
    // Expiration du scan après 60 secondes
    if (pendingScan && scanTimestamp && (Date.now() - scanTimestamp > 60000)) {
      pendingScan = null;
      scanTimestamp = null;
    }

    if (!pendingScan) {
      return res.json({ success: true, hasScan: false });
    }

    // Récupérer les candidats aussi
    const candidats = await Candidat.findAll({
      where: { statut: 'actif' },
      order: [['numero_ordre', 'ASC']],
      attributes: ['id', 'prenom', 'nom', 'parti', 'photo_url', 'numero_ordre', 'couleur']
    });

    res.json({
      success: true,
      hasScan: true,
      data: {
        electeur: pendingScan,
        candidats
      }
    });
  } catch (error) {
    console.error('Erreur scan status:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Effacer le scan en attente
 * POST /api/arduino/clear-scan
 */
const clearScan = (req, res) => {
  pendingScan = null;
  scanTimestamp = null;
  clearWebCniSession();
  res.json({ success: true, message: 'Scan effacé.' });
};

/**
 * Vote depuis la page web Arduino (après scan d'empreinte)
 * POST /api/arduino/web-vote
 */
const webVote = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED'
      });
    }

    const { electeur_id, candidat_id, device_id } = req.body;
    const isVoteBlanc = candidat_id === null || candidat_id === 'blanc';

    if (!electeur_id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID électeur requis.' });
    }

    // Vérifier l'électeur (verrouillage ligne pour éviter vote simultané en ligne/Arduino)
    const electeur = await Electeur.findByPk(electeur_id, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!electeur || electeur.statut !== 'actif') {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Électeur non trouvé.' });
    }

    if (electeur.a_vote) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Cet électeur a déjà voté.' });
    }

    // Vérifier le candidat (sauf vote blanc)
    let candidat = null;
    if (!isVoteBlanc) {
      candidat = await Candidat.findByPk(candidat_id, { transaction });
      if (!candidat || candidat.statut !== 'actif') {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Candidat invalide.' });
      }
    }

    // Enregistrer le vote
    const voteHash = generateVoteHash(electeur.id, isVoteBlanc ? 'blanc' : candidat_id, Date.now());

    await Vote.create({
      electeur_id: electeur.id,
      candidat_id: isVoteBlanc ? null : candidat_id,
      methode: 'arduino',
      device_id: device_id || 'WEB_ARDUINO',
      departement_vote: electeur.departement,
      centre_vote: electeur.centre_vote,
      bureau_vote: electeur.bureau_vote,
      hash_vote: voteHash,
      date_vote: new Date()
    }, { transaction });

    // Mettre à jour l'électeur
    electeur.a_vote = true;
    electeur.methode_vote = 'arduino';
    electeur.date_vote = new Date();
    await electeur.save({ transaction });

    // Incrémenter le compteur (sauf vote blanc)
    if (!isVoteBlanc && candidat) {
      candidat.nombre_votes += 1;
      await candidat.save({ transaction });
    }

    await transaction.commit();

    // Marquer le vote comme terminé (l'ESP32 le détectera et émettra le bip)
    pendingScan = null;
    scanTimestamp = null;
    voteCompleted = true;

    const candidatNom = isVoteBlanc ? 'Vote Blanc' : `${candidat.prenom} ${candidat.nom}`;

    res.json({
      success: true,
      message: 'Vote enregistré avec succès.',
      data: {
        electeur: `${electeur.prenom} ${electeur.nom}`,
        departement: electeur.departement,
        centre_vote: electeur.centre_vote,
        bureau_vote: electeur.bureau_vote,
        candidat: candidatNom,
        hash_vote: voteHash
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur web vote Arduino:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Rechercher un électeur par CNI (pour enregistrement empreinte via web)
 * POST /api/arduino/find-by-cni
 */
const findByCni = async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED'
      });
    }

    const { numero_cni } = req.body;
    if (!numero_cni) {
      return res.status(400).json({ success: false, message: 'Numéro CNI requis.' });
    }

    const electeur = await Electeur.findOne({
      where: { numero_cni: numero_cni.trim(), statut: 'actif' },
      attributes: [
        'id', 'prenom', 'nom', 'numero_cni', 'code_electoral', 'empreinte_id', 'a_vote',
        'departement', 'centre_vote', 'bureau_vote'
      ]
    });

    if (!electeur) {
      return res.status(404).json({ success: false, message: 'Électeur non trouvé avec ce numéro CNI.' });
    }

    // Vérifier si l'électeur a déjà voté
    if (electeur.a_vote) {
      return res.status(403).json({
        success: false,
        message: `${electeur.prenom} ${electeur.nom} a déjà voté.`,
        code: 'DEJA_VOTE'
      });
    }

    // Nouveau cycle CNI: on purge tout scan précédent pour éviter
    // qu'une ancienne empreinte en attente provoque un faux mismatch.
    pendingScan = null;
    scanTimestamp = null;
    voteCompleted = false;
    webSessionElecteurId = electeur.id;
    webSessionAt = Date.now();

    res.json({
      success: true,
      data: {
        electeur_id: electeur.id,
        prenom: electeur.prenom,
        nom: electeur.nom,
        numero_cni: electeur.numero_cni,
        departement: electeur.departement,
        centre_vote: electeur.centre_vote,
        bureau_vote: electeur.bureau_vote,
        empreinte_deja_enregistree: electeur.empreinte_id !== null
      }
    });
  } catch (error) {
    console.error('Erreur recherche CNI:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Flux unifié : Rechercher par CNI + Enregistrer empreinte + Préparer au vote
 * POST /api/arduino/register-and-prepare
 * Body: { numero_cni, empreinte_id }
 * 
 * Scénario :
 * 1. L'opérateur saisit le CNI → on retrouve l'électeur
 * 2. L'Arduino scanne l'empreinte → on reçoit l'empreinte_id
 * 3. Si l'empreinte n'est pas encore liée → on l'associe à l'électeur
 * 4. On renvoie l'électeur + les candidats pour voter directement
 */
const registerAndPrepare = async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canVote) {
      return res.status(403).json({
        success: false,
        message: electionStatus.message,
        code: 'VOTE_CLOSED'
      });
    }

    const { numero_cni, empreinte_id } = req.body;

    if (!numero_cni) {
      return res.status(400).json({ success: false, message: 'Numéro CNI requis.' });
    }
    if (!empreinte_id) {
      return res.status(400).json({ success: false, message: 'ID empreinte requis.' });
    }

    // Vérification anti-rejeu/usurpation:
    // Le register-and-prepare doit correspondre exactement au dernier scan en attente.
    if (!pendingScan || !scanTimestamp || (Date.now() - scanTimestamp > 60000)) {
      pendingScan = null;
      scanTimestamp = null;
      return res.status(409).json({
        success: false,
        message: 'Aucun scan valide en attente. Recommencez la lecture de l’empreinte.'
      });
    }

    if (pendingScan.empreinte_id?.toString() !== empreinte_id.toString()) {
      return res.status(409).json({
        success: false,
        message: 'Empreinte incohérente. Recommencez le scan.'
      });
    }

    // 1. Trouver l'électeur par CNI
    const electeur = await Electeur.findOne({
      where: { numero_cni: numero_cni.trim(), statut: 'actif' }
    });

    if (!electeur) {
      return res.status(404).json({ success: false, message: 'Électeur non trouvé avec ce numéro CNI.' });
    }

    if (electeur.a_vote) {
      return res.status(403).json({
        success: false,
        message: 'Cet électeur a déjà voté.',
        code: 'DEJA_VOTE'
      });
    }

    // Si le scan vient d'une empreinte déjà reconnue, elle doit forcément appartenir
    // au même électeur que le CNI saisi. Sinon -> tentative d'usurpation.
    if (pendingScan.electeur_id && pendingScan.electeur_id !== electeur.id) {
      pendingScan = null;
      scanTimestamp = null;
      return res.status(403).json({
        success: false,
        message: 'Empreinte non autorisée pour ce CNI.',
        code: 'EMPREINTE_CNI_MISMATCH'
      });
    }

    // 2. Vérifier que l'empreinte n'est pas déjà utilisée par un AUTRE électeur
    const existant = await Electeur.findOne({ where: { empreinte_id: empreinte_id.toString() } });
    if (existant && existant.id !== electeur.id) {
      pendingScan = null;
      scanTimestamp = null;
      return res.status(409).json({
        success: false,
        message: 'Cette empreinte est déjà associée à un autre électeur.'
      });
    }

    // 3. Associer l'empreinte si pas encore fait
    if (!electeur.empreinte_id || electeur.empreinte_id !== empreinte_id.toString()) {
      electeur.empreinte_id = empreinte_id.toString();
      await electeur.save();
    }

    // 4. Récupérer les candidats
    const candidats = await Candidat.findAll({
      where: { statut: 'actif' },
      order: [['numero_ordre', 'ASC']],
      attributes: ['id', 'prenom', 'nom', 'parti', 'photo_url', 'numero_ordre', 'couleur']
    });

    pendingScan = null;
    scanTimestamp = null;
    clearWebCniSession();

    res.json({
      success: true,
      message: 'Électeur identifié et empreinte enregistrée.',
      data: {
        electeur: {
          electeur_id: electeur.id,
          prenom: electeur.prenom,
          nom: electeur.nom,
          departement: electeur.departement,
          centre_vote: electeur.centre_vote,
          bureau_vote: electeur.bureau_vote,
          empreinte_id: electeur.empreinte_id
        },
        candidats
      }
    });

  } catch (error) {
    console.error('Erreur register-and-prepare:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * L'ESP32 consulte ce endpoint pour savoir si le vote a été enregistré
 * GET /api/arduino/vote-complete-status
 * Headers: X-API-Key
 */
const getVoteCompleteStatus = (req, res) => {
  res.json({ success: true, voteCompleted });
};

/**
 * L'ESP32 appelle ce endpoint pour réinitialiser le flag après avoir bippé
 * POST /api/arduino/reset-vote-status
 * Headers: X-API-Key
 */
const resetVoteStatus = (req, res) => {
  voteCompleted = false;
  res.json({ success: true, message: 'Statut réinitialisé.' });
};

module.exports = { 
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
};
