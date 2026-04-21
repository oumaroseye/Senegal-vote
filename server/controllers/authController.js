const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Electeur = require('../models/Electeur');
const OTP = require('../models/OTP');
const { generateOTP } = require('../utils/generateOTP');
const { sendEmail, emailOTPTemplate } = require('../utils/sendEmail');

/**
 * Étape 1: Vérification des identifiants (CNI + code électoral)
 * POST /api/auth/verify
 */
const verifierIdentite = async (req, res) => {
  try {
    const numero_cni = (req.body.numero_cni || '').trim();
    const code_electoral = (req.body.code_electoral || '').trim().toUpperCase();

    // Validation
    if (!numero_cni || !code_electoral) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires (CNI et code électoral).'
      });
    }

    // Rechercher l'électeur
    const electeur = await Electeur.findOne({
      where: {
        numero_cni,
        code_electoral,
        statut: 'actif'
      }
    });

    if (!electeur) {
      return res.status(404).json({
        success: false,
        message: 'Identifiants invalides. Vérifiez votre CNI et code électoral.'
      });
    }

    // Vérifier si l'électeur a déjà voté
    if (electeur.a_vote) {
      return res.status(403).json({
        success: false,
        message: 'Vous avez déjà voté. Chaque électeur ne peut voter qu\'une seule fois.'
      });
    }

    // Créer un token temporaire (15 min) - étape email_pending
    const tempToken = jwt.sign(
      { id: electeur.id, step: 'email_pending', type: 'electeur' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Identité vérifiée. Veuillez saisir votre adresse email.',
      data: {
        tempToken,
        prenom: electeur.prenom
      }
    });

  } catch (error) {
    console.error('Erreur vérification identité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
};

/**
 * Étape 2: L'électeur saisit son email → OTP envoyé
 * POST /api/auth/send-otp
 */
const envoyerOTP = async (req, res) => {
  try {
    const electeurId = req.electeur.id;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'L\'adresse email est obligatoire.'
      });
    }

    // Validation basique du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide.'
      });
    }

    const electeur = await Electeur.findByPk(electeurId);
    if (!electeur) {
      return res.status(404).json({
        success: false,
        message: 'Électeur non trouvé.'
      });
    }

    // Sauvegarder l'email de l'électeur
    electeur.email = email;
    await electeur.save();

    // Générer OTP
    const otpCode = generateOTP();
    const expireAt = new Date(Date.now() + process.env.OTP_EXPIRES_MINUTES * 60 * 1000);

    // Invalider les anciens OTPs
    await OTP.update(
      { utilise: true },
      { where: { electeur_id: electeur.id, type: 'authentification', utilise: false } }
    );

    // Créer nouvel OTP
    await OTP.create({
      electeur_id: electeur.id,
      code: otpCode,
      type: 'authentification',
      expire_at: expireAt
    });

    // Envoyer par Email
    await sendEmail(
      email,
      'Code de vérification - Sénégal Vote',
      emailOTPTemplate(electeur.prenom, otpCode, 'authentification')
    );

    // Nouveau token avec étape otp_pending
    const tempToken = jwt.sign(
      { id: electeur.id, step: 'otp_pending', type: 'electeur' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Masquer l'email pour l'affichage
    const emailParts = email.split('@');
    const emailMasque = emailParts[0].substring(0, 3) + '****@' + emailParts[1];

    res.json({
      success: true,
      message: 'Code OTP envoyé par email.',
      data: {
        tempToken,
        email_masque: emailMasque
      }
    });

  } catch (error) {
    console.error('Erreur envoi OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
};

/**
 * Étape 3: Vérification du code OTP d'authentification
 * POST /api/auth/verify-otp
 */
const verifierOTP = async (req, res) => {
  try {
    const { code } = req.body;
    const electeurId = req.electeur.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Le code OTP est obligatoire.'
      });
    }

    // Trouver l'OTP valide
    const otp = await OTP.findOne({
      where: {
        electeur_id: electeurId,
        type: 'authentification',
        utilise: false,
        expire_at: { [Op.gt]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Code OTP expiré ou invalide. Veuillez demander un nouveau code.'
      });
    }

    // Vérifier les tentatives
    if (otp.tentatives >= 3) {
      otp.utilise = true;
      await otp.save();
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez demander un nouveau code.'
      });
    }

    // Vérifier le code
    if (otp.code !== code) {
      otp.tentatives += 1;
      await otp.save();
      return res.status(400).json({
        success: false,
        message: `Code OTP incorrect. ${3 - otp.tentatives} tentative(s) restante(s).`
      });
    }

    // Marquer OTP comme utilisé
    otp.utilise = true;
    await otp.save();

    // Récupérer l'électeur
    const electeur = await Electeur.findByPk(electeurId);

    // Générer token d'accès complet
    const accessToken = jwt.sign(
      { 
        id: electeur.id, 
        prenom: electeur.prenom,
        nom: electeur.nom,
        type: 'electeur',
        step: 'authenticated'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Authentification réussie. Bienvenue !',
      data: {
        token: accessToken,
        electeur: {
          id: electeur.id,
          prenom: electeur.prenom,
          nom: electeur.nom,
          region: electeur.region,
          a_vote: electeur.a_vote
        }
      }
    });

  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur. Veuillez réessayer.'
    });
  }
};

/**
 * Renvoyer un code OTP
 * POST /api/auth/resend-otp
 */
const renvoyerOTP = async (req, res) => {
  try {
    const electeurId = req.electeur.id;
    const electeur = await Electeur.findByPk(electeurId);

    if (!electeur) {
      return res.status(404).json({
        success: false,
        message: 'Électeur non trouvé.'
      });
    }

    if (!electeur.email) {
      return res.status(400).json({
        success: false,
        message: 'Aucun email associé. Veuillez revenir à l\'étape précédente.'
      });
    }

    // Invalider anciens OTPs
    await OTP.update(
      { utilise: true },
      { where: { electeur_id: electeur.id, type: 'authentification', utilise: false } }
    );

    // Nouveau OTP
    const otpCode = generateOTP();
    const expireAt = new Date(Date.now() + process.env.OTP_EXPIRES_MINUTES * 60 * 1000);

    await OTP.create({
      electeur_id: electeur.id,
      code: otpCode,
      type: 'authentification',
      expire_at: expireAt
    });

    await sendEmail(
      electeur.email,
      'Nouveau code de vérification - Sénégal Vote',
      emailOTPTemplate(electeur.prenom, otpCode, 'authentification')
    );

    res.json({
      success: true,
      message: 'Nouveau code OTP envoyé.'
    });

  } catch (error) {
    console.error('Erreur renvoi OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
};

module.exports = { verifierIdentite, envoyerOTP, verifierOTP, renvoyerOTP };
