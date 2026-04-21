sudo# 🇸🇳 Sénégal Vote - Plateforme de Vote Électronique

## Projet de Soutenance de Fin d'Année

### Description

**Sénégal Vote** est une plateforme de vote électronique sécurisée développée dans le cadre d'un projet de soutenance. Elle permet aux électeurs sénégalais de voter en ligne lors des élections présidentielles, tout en offrant une alternative via un système Arduino avec capteur d'empreinte digitale pour les électeurs sans accès internet.

---

## Architecture du Projet

```
senegal-vote/
├── client/                  # Frontend React.js
│   ├── src/
│   │   ├── components/      # Composants réutilisables (Navbar, Footer)
│   │   ├── context/         # Context API (AuthContext)
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Services API (axios)
│   │   ├── App.jsx          # Routeur principal
│   │   └── index.css        # Styles globaux
│   └── vite.config.js
├── server/                  # Backend Node.js
│   ├── config/              # Configuration BDD
│   ├── controllers/         # Logique métier
│   ├── middleware/           # Authentification JWT
│   ├── models/              # Modèles Sequelize (ORM)
│   ├── routes/              # Routes API REST
│   ├── utils/               # Utilitaires (OTP, Email, SMS)
│   ├── app.js               # Serveur Express
│   └── seed.js              # Données de test
├── arduino/                 # Code Arduino
│   └── vote_empreinte.ino   # Programme vote par empreinte
├── docs/                    # Documentation UML
└── README.md
```

---

## Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| **Frontend** | React.js 19 + Vite + Tailwind CSS |
| **Backend** | Node.js 20 + Express.js |
| **Base de données** | MySQL 8.0 + Sequelize ORM |
| **Authentification** | JWT + OTP (SMS/Email) |
| **IoT** | Arduino + Capteur Empreinte AS608 |
| **Communication** | API REST JSON |

---

## Fonctionnalités

### Vote en Ligne (Web)
- Authentification par **CNI + Téléphone + Code Électoral**
- Double vérification par **OTP** (SMS + Email)
- Sélection du candidat avec interface visuelle
- Confirmation du vote par second OTP
- Hash SHA-256 pour garantir l'intégrité

### Vote par Empreinte Digitale (Arduino)
- Identification biométrique par empreinte digitale
- Interface LCD pour affichage des candidats
- Boutons physiques pour la sélection
- Synchronisation en temps réel via API REST

### Administration
- Dashboard avec statistiques en temps réel
- Gestion des électeurs (CRUD)
- Gestion des candidats
- Résultats en direct avec pourcentages

---

## Installation et Démarrage

### Prérequis
- **Node.js** 18+ (installé via nvm)
- **MySQL** 8.0
- **npm** 8+

### 1. Cloner le projet
```bash
cd /chemin/vers/votre/dossier
git clone <url-du-repo> senegal-vote
cd senegal-vote
```

### 2. Configurer la base de données
```bash
# Se connecter à MySQL
mysql -u mininoc -pmininoc

# La base 'mininoc' est utilisée
```

### 3. Installer les dépendances
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Configurer l'environnement
Éditer le fichier `server/.env` avec vos paramètres.

### 5. Peupler la base de données
```bash
cd server
node seed.js
```

### 6. Démarrer les serveurs
```bash
# Terminal 1 - Backend (port 5000)
cd server
node app.js

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

### 7. Accéder à l'application
- **Site public** : http://localhost:5173
- **Administration** : http://localhost:5173/admin
- **API** : http://localhost:5000/api

---

## Comptes de Test

### Administrateur
| Email | Mot de passe |
|-------|-------------|
| admin@senegalvote.sn | admin123 |

### Électeurs
| Nom | CNI | Téléphone | Code Électoral |
|-----|-----|-----------|----------------|
| Moussa Diallo | 1234567890123 | 771234567 | SN-ABD12-XY78 |
| Fatou Ndiaye | 2345678901234 | 782345678 | SN-CDE34-ZW56 |
| Ibrahima Fall | 3456789012345 | 763456789 | SN-FGH56-UV34 |
| Aminata Sow | 4567890123456 | 774567890 | SN-IJK78-ST12 |
| Ousmane Mbaye | 5678901234567 | 785678901 | SN-LMN90-QR34 |

> **Note** : En mode développement, les codes OTP sont affichés dans la console du serveur backend.

---

## API REST - Endpoints

### Authentification (`/api/auth`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/verify` | Vérifier CNI + téléphone + code |
| POST | `/api/auth/verify-otp` | Valider le code OTP |
| POST | `/api/auth/resend-otp` | Renvoyer un code OTP |

### Vote (`/api/vote`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/vote/candidats` | Liste des candidats |
| POST | `/api/vote/select` | Sélectionner un candidat |
| POST | `/api/vote/confirm` | Confirmer le vote avec OTP |

### Arduino (`/api/arduino`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/arduino/verify-fingerprint` | Vérifier empreinte |
| POST | `/api/arduino/vote` | Enregistrer un vote |
| POST | `/api/arduino/register-fingerprint` | Enregistrer empreinte |
| GET | `/api/arduino/candidats` | Liste candidats |

### Administration (`/api/admin`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/admin/login` | Connexion admin |
| GET | `/api/admin/dashboard` | Tableau de bord |
| GET | `/api/admin/resultats` | Résultats détaillés |
| POST | `/api/admin/electeurs` | Ajouter électeur |
| GET | `/api/admin/electeurs` | Liste électeurs |
| POST | `/api/admin/candidats` | Ajouter candidat |

---

## Modélisation UML

Les diagrammes UML suivants ont été réalisés pour la conception du système :

1. **Diagramme de cas d'utilisation** - Acteurs et fonctionnalités
2. **Diagramme de classes** - Structure des données
3. **Diagramme de séquence** - Processus de vote en ligne
4. **Diagramme de séquence** - Processus de vote Arduino
5. **Diagramme d'activité** - Flux d'authentification
6. **Diagramme de déploiement** - Architecture technique

(Voir le dossier `docs/` pour les fichiers PlantUML)

---

## Sécurité

- **JWT** pour l'authentification avec expiration
- **Bcrypt** pour le hashage des mots de passe
- **Rate Limiting** pour prévenir les attaques brute force
- **CORS** configuré pour les origines autorisées
- **Helmet** pour les headers de sécurité
- **Validation** des entrées avec express-validator
- **Transactions SQL** pour l'intégrité des votes
- **Hash SHA-256** unique pour chaque vote

---

## Arduino - Matériel Requis

| Composant | Quantité | Description |
|-----------|----------|-------------|
| Arduino Mega 2560 / ESP32 | 1 | Microcontrôleur |
| Capteur empreinte AS608/R307 | 1 | Module biométrique |
| Écran LCD I2C 20x4 | 1 | Affichage |
| Module WiFi ESP8266 | 1 | Communication (si Arduino Mega) |
| Boutons poussoirs | 5 | Sélection candidats |
| LEDs (vert + rouge) | 2 | Indicateurs |
| Buzzer | 1 | Signal sonore |
| Breadboard + câbles | - | Connexions |

---

## Auteurs

Projet réalisé dans le cadre de la soutenance de fin d'année.

---

*© 2025 Sénégal Vote - Tous droits réservés*
