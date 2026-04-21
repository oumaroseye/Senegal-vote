const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const voteRoutes = require('./routes/voteRoutes');
const arduinoRoutes = require('./routes/arduinoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Import des modèles (pour les associations)
require('./models/index');

const app = express();

// ==================== MIDDLEWARES ====================

// Faire confiance au proxy Apache (nécessaire pour rate-limit derrière un reverse proxy)
app.set('trust proxy', 1);

// Sécurité
app.use(helmet());

// CORS - accepter toutes les origines du réseau local
app.use(cors({
  origin: function(origin, callback) {
    // Accepter les requêtes sans origin (apps mobiles, curl, etc.)
    if (!origin) return callback(null, true);
    // Accepter localhost et réseau local
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/)) {
      return callback(null, true);
    }
    return callback(null, true); // Accepter tout en dev
  },
  credentials: true
}));

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.'
  }
});
app.use('/api/', limiter);

// Rate limiting spécifique pour l'auth (plus strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.'
  }
});

// ==================== ROUTES ====================

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🇸🇳 Bienvenue sur l\'API Sénégal Vote',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      vote: '/api/vote',
      arduino: '/api/arduino',
      admin: '/api/admin',
      public: '/api/public'
    }
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/arduino', arduinoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// ==================== GESTION DES ERREURS ====================

// Route non trouvée (API uniquement, si pas de client servi)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée.'
  });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur.'
  });
});

// ==================== DÉMARRAGE ====================

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Tester la connexion DB
    await testConnection();

    // Synchroniser les modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données.');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`\n🇸🇳 Serveur Sénégal Vote démarré sur le port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV}\n`);
    });
  } catch (error) {
    console.error('Erreur de démarrage:', error);
    process.exit(1);
  }
};

start();

module.exports = app;
