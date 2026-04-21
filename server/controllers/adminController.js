const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Admin = require('../models/Admin');
const Electeur = require('../models/Electeur');
const Candidat = require('../models/Candidat');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const { generateCodeElectoral } = require('../utils/generateOTP');
const { getElectionWindowStatus } = require('../utils/electionWindow');
const { DEPARTEMENT_CENTRES, BUREAUX, isValidDepartement, isValidCentre, isValidBureau } = require('../utils/voteLocations');

const ensureAdminNotPresident = (req, res) => {
  if (req.admin.role === 'president_centre') {
    res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs.'
    });
    return false;
  }
  return true;
};

/**
 * Connexion admin
 * POST /api/admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email, statut: 'actif' } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    const isMatch = await admin.verifierPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        token,
        admin: {
          id: admin.id,
          prenom: admin.prenom,
          nom: admin.nom,
          email: admin.email,
          role: admin.role,
          departement: admin.departement,
          centre_vote: admin.centre_vote
        }
      }
    });

  } catch (error) {
    console.error('Erreur login admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Ajouter un électeur
 * POST /api/admin/electeurs
 */
const ajouterElecteur = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canModify) {
      return res.status(403).json({
        success: false,
        message: 'Modifications verrouillées pendant la période de vote.'
      });
    }

    const {
      prenom, nom, date_naissance, adresse, region, numero_cni, telephone, email,
      departement, centre_vote, bureau_vote
    } = req.body;

    if (!departement || !centre_vote || !bureau_vote) {
      return res.status(400).json({
        success: false,
        message: 'Département, centre de vote et bureau de vote sont obligatoires.'
      });
    }
    if (!isValidDepartement(departement) || !isValidCentre(departement, centre_vote) || !isValidBureau(bureau_vote)) {
      return res.status(400).json({
        success: false,
        message: 'Localisation de vote invalide (département/centre/bureau).'
      });
    }

    // Sécurité: un seul enregistrement par CNI (sinon une même personne pourrait voter plusieurs fois via des lignes différentes)
    const existingCni = await Electeur.findOne({ where: { numero_cni } });
    if (existingCni) {
      return res.status(409).json({
        success: false,
        message: 'Un électeur avec ce CNI existe déjà.'
      });
    }

    // Générer un code électoral unique
    let code_electoral;
    let isUnique = false;
    while (!isUnique) {
      code_electoral = generateCodeElectoral();
      const existing = await Electeur.findOne({ where: { code_electoral } });
      if (!existing) isUnique = true;
    }

    const electeur = await Electeur.create({
      prenom, nom, date_naissance, adresse, region,
      numero_cni, telephone, email, code_electoral,
      departement, centre_vote, bureau_vote
    });

    res.status(201).json({
      success: true,
      message: 'Électeur ajouté avec succès.',
      data: {
        ...electeur.toJSON(),
        code_electoral
      }
    });

  } catch (error) {
    console.error('Erreur ajout électeur:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Un électeur avec ce CNI ou code électoral existe déjà.'
      });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: error.errors.map(e => e.message).join(', ')
      });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Lister les électeurs
 * GET /api/admin/electeurs
 */
const getElecteurs = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const { page = 1, limit = 20, search, statut } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    if (search) {
      where[Op.or] = [
        { prenom: { [Op.like]: `%${search}%` } },
        { nom: { [Op.like]: `%${search}%` } },
        { numero_cni: { [Op.like]: `%${search}%` } },
        { code_electoral: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Electeur.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        electeurs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erreur listing électeurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Désactiver (supprimer) un électeur
 * DELETE /api/admin/electeurs/:id
 */
const supprimerElecteur = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canModify) {
      return res.status(403).json({
        success: false,
        message: 'Modifications verrouillées pendant la période de vote.'
      });
    }

    const electeur = await Electeur.findByPk(req.params.id);
    if (!electeur) {
      return res.status(404).json({
        success: false,
        message: 'Électeur introuvable.'
      });
    }

    if (electeur.a_vote) {
      return res.status(409).json({
        success: false,
        message: 'Impossible de supprimer un électeur ayant déjà voté.'
      });
    }

    electeur.statut = 'inactif';
    await electeur.save();

    res.json({
      success: true,
      message: 'Électeur supprimé (désactivé) avec succès.'
    });
  } catch (error) {
    console.error('Erreur suppression électeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Ajouter un candidat
 * POST /api/admin/candidats
 */
const ajouterCandidat = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canModify) {
      return res.status(403).json({
        success: false,
        message: 'Modifications verrouillées pendant la période de vote.'
      });
    }

    const { prenom, nom, parti, slogan, programme, photo_url, couleur, numero_ordre, election_id } = req.body;

    const candidat = await Candidat.create({
      prenom, nom, parti, slogan, programme, photo_url, couleur, numero_ordre, election_id
    });

    res.status(201).json({
      success: true,
      message: 'Candidat ajouté avec succès.',
      data: candidat
    });

  } catch (error) {
    console.error('Erreur ajout candidat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Tableau de bord - Statistiques
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const electionStatus = await getElectionWindowStatus();
    const isPresident = req.admin.role === 'president_centre';
    const whereElecteurs = { statut: 'actif' };
    const whereVotes = {};
    if (req.admin.role === 'president_centre') {
      whereElecteurs.departement = req.admin.departement;
      whereElecteurs.centre_vote = req.admin.centre_vote;
      whereVotes.departement_vote = req.admin.departement;
      whereVotes.centre_vote = req.admin.centre_vote;
    }
    const totalElecteurs = await Electeur.count({ where: whereElecteurs });
    const shouldHideResults = !electionStatus.canShowResults;
    const canShowCandidateResults = !shouldHideResults;

    let totalVotants = 0;
    let votesEnLigne = 0;
    let votesArduino = 0;
    let votesBlancs = 0;
    let tauxParticipation = 0;
    let resultats = [];
    let votesParHeure = [];

    // Pour le président, on calcule les compteurs pendant tout le scrutin,
    // même si les résultats candidats sont masqués au public.
    if (isPresident || canShowCandidateResults) {
      totalVotants = await Vote.count({ where: whereVotes });
      votesEnLigne = await Vote.count({ where: { ...whereVotes, methode: 'en_ligne' } });
      votesArduino = await Vote.count({ where: { ...whereVotes, methode: 'arduino' } });
      votesBlancs = await Vote.count({ where: { ...whereVotes, candidat_id: null } });
      tauxParticipation = totalElecteurs > 0 ? parseFloat(((totalVotants / totalElecteurs) * 100).toFixed(2)) : 0;

      if (canShowCandidateResults && !isPresident) {
        // Résultats candidats globaux (admin) uniquement si autorisé
        resultats = await Candidat.findAll({
          where: { statut: 'actif' },
          attributes: ['id', 'prenom', 'nom', 'parti', 'couleur', 'nombre_votes', 'photo_url'],
          order: [['nombre_votes', 'DESC']]
        });
      } else {
        // Président: on masque les résultats candidats
        resultats = [];
      }

      if (canShowCandidateResults && !isPresident) {
        // Votes par heure (uniquement admin global)
        votesParHeure = await Vote.findAll({
          attributes: [
            [sequelize.fn('HOUR', sequelize.col('date_vote')), 'heure'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'total']
          ],
          where: {
            ...whereVotes,
            date_vote: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          group: [sequelize.fn('HOUR', sequelize.col('date_vote'))],
          order: [[sequelize.fn('HOUR', sequelize.col('date_vote')), 'ASC']]
        });
      }
    }

    let votesParBureau = [];
    if (isPresident) {
      votesParBureau = await Vote.findAll({
        attributes: [
          'bureau_vote',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        where: whereVotes,
        group: ['bureau_vote'],
        order: [['bureau_vote', 'ASC']]
      });
    }

    res.json({
      success: true,
      data: {
        results_hidden: shouldHideResults,
        zone_admin: req.admin.role === 'president_centre' ? {
          departement: req.admin.departement,
          centre_vote: req.admin.centre_vote
        } : null,
        statistiques: {
          total_electeurs: totalElecteurs,
          total_votants: totalVotants,
          votes_en_ligne: votesEnLigne,
          votes_arduino: votesArduino,
          votes_blancs: votesBlancs,
          taux_participation: tauxParticipation
        },
        resultats,
        votes_par_heure: votesParHeure,
        votes_par_bureau: votesParBureau
      }
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Résultats détaillés
 * GET /api/admin/resultats
 */
const getResultats = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canShowResults) {
      return res.status(403).json({
        success: false,
        code: 'RESULTS_HIDDEN',
        message: 'Les résultats ne sont pas accessibles pendant la période de vote.',
        data: electionStatus
      });
    }

    const whereVotes = {};
    const totalVotes = await Vote.count({ where: whereVotes });
    const votesBlancs = await Vote.count({ where: { ...whereVotes, candidat_id: null } });

    const resultats = await Candidat.findAll({
      where: { statut: 'actif' },
      attributes: [
        'id', 'prenom', 'nom', 'parti', 'couleur', 'photo_url', 'nombre_votes',
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
        votes_blancs: votesBlancs,
        resultats
      }
    });

  } catch (error) {
    console.error('Erreur résultats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Créer une élection
 * POST /api/admin/elections
 */
const creerElection = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const electionStatus = await getElectionWindowStatus();
    if (!electionStatus.canModify) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier la configuration pendant la période de vote.'
      });
    }

    const { titre, description, type, date_debut, date_fin } = req.body;
    
    const election = await Election.create({
      titre, description, type, date_debut, date_fin
    });

    res.status(201).json({
      success: true,
      message: 'Élection créée avec succès.',
      data: election
    });
  } catch (error) {
    console.error('Erreur création élection:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

/**
 * Lister les élections
 * GET /api/admin/elections
 */
const getElections = async (req, res) => {
  try {
    if (!ensureAdminNotPresident(req, res)) return;
    const elections = await Election.findAll({
      order: [['date_debut', 'DESC']],
      include: [{ model: Candidat, as: 'candidats' }]
    });

    res.json({ success: true, data: elections });
  } catch (error) {
    console.error('Erreur listing élections:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

const getVoteLocations = async (req, res) => {
  res.json({
    success: true,
    data: {
      departements: Object.keys(DEPARTEMENT_CENTRES),
      centres_par_departement: DEPARTEMENT_CENTRES,
      bureaux: BUREAUX
    }
  });
};

const creerPresidentCentre = async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Action réservée au super administrateur.'
      });
    }

    const { prenom, nom, email, password, departement, centre_vote } = req.body;
    if (!prenom || !nom || !email || !password || !departement || !centre_vote) {
      return res.status(400).json({
        success: false,
        message: 'Prénom, nom, email, mot de passe, département et centre sont obligatoires.'
      });
    }
    if (!isValidCentre(departement, centre_vote)) {
      return res.status(400).json({
        success: false,
        message: 'Centre de vote invalide pour ce département.'
      });
    }

    const existe = await Admin.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email.'
      });
    }

    const president = await Admin.create({
      prenom,
      nom,
      email,
      password,
      role: 'president_centre',
      departement,
      centre_vote,
      statut: 'actif'
    });

    res.status(201).json({
      success: true,
      message: 'Président de centre créé avec succès.',
      data: {
        id: president.id,
        prenom: president.prenom,
        nom: president.nom,
        email: president.email,
        role: president.role,
        departement: president.departement,
        centre_vote: president.centre_vote
      }
    });
  } catch (error) {
    console.error('Erreur création président de centre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

module.exports = {
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
};
