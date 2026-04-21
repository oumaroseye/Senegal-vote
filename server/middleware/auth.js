const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Middleware d'authentification JWT pour les électeurs
 */
const authElecteur = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ Auth: Token manquant ou invalide. Header:', authHeader);
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Veuillez vous reconnecter.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'electeur') {
      console.log('❌ Auth: Type invalide:', decoded.type);
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé.' 
      });
    }

    req.electeur = decoded;
    next();
  } catch (error) {
    console.log('❌ Auth erreur:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expirée. Veuillez vous reconnecter.' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Token invalide. Veuillez vous reconnecter.' 
    });
  }
};

/**
 * Middleware d'authentification JWT pour les admins
 */
const authAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès réservé aux administrateurs.' 
      });
    }

    const admin = await Admin.findByPk(decoded.id);
    if (!admin || admin.statut !== 'actif') {
      return res.status(403).json({ 
        success: false, 
        message: 'Compte administrateur inactif.' 
      });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      departement: admin.departement,
      centre_vote: admin.centre_vote,
      type: 'admin'
    };
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token invalide.' 
    });
  }
};

/**
 * Middleware d'authentification pour Arduino (via API Key)
 */
const authArduino = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey || apiKey !== process.env.ARDUINO_API_KEY) {
      return res.status(401).json({ 
        success: false, 
        message: 'Clé API Arduino invalide.' 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Erreur d\'authentification Arduino.' 
    });
  }
};

module.exports = { authElecteur, authAdmin, authArduino };
