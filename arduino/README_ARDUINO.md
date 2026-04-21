# Arduino - Système de Vote par Empreinte Digitale

## Architecture du Système Arduino

Le système Arduino communique avec le serveur backend via API REST.
L'Arduino envoie les requêtes HTTP avec une clé API dans le header `X-API-Key`.

```
┌─────────────────┐     WiFi/HTTP      ┌──────────────┐      MySQL
│  Arduino + ESP   │ ←───────────────→  │  Serveur API  │ ←──────→ BDD
│  + Capteur AS608 │   API REST JSON    │  Express.js   │
│  + LCD + Boutons │                    │  Port 5000    │
└─────────────────┘                     └──────────────┘
```

## Matériel Requis

| Composant | Référence | Prix estimé | Lien |
|-----------|-----------|-------------|------|
| Arduino Mega 2560 | - | ~15 000 FCFA | - |
| Capteur empreinte | AS608 / R307 | ~5 000 FCFA | - |
| Écran LCD I2C | 20x4 caractères | ~3 000 FCFA | - |
| Module WiFi | ESP8266-01 | ~2 000 FCFA | - |
| Boutons poussoirs | x5 | ~500 FCFA | - |
| LEDs (vert/rouge) | x2 | ~100 FCFA | - |
| Buzzer | Piezo | ~200 FCFA | - |
| Breadboard | 830 points | ~1 500 FCFA | - |
| Câbles jumper | M/M, M/F | ~500 FCFA | - |

**Alternative recommandée** : Utiliser un **ESP32** qui intègre le WiFi nativement.

## Schéma de Câblage

```
Arduino Mega 2560 / ESP32
├── Capteur Empreinte AS608
│   ├── VCC → 3.3V
│   ├── GND → GND
│   ├── TX  → RX2 (Pin 16)
│   └── RX  → TX2 (Pin 17)
│
├── LCD I2C 20x4
│   ├── VCC → 5V
│   ├── GND → GND
│   ├── SDA → Pin 20 (SDA)
│   └── SCL → Pin 21 (SCL)
│
├── ESP8266 (si Arduino Mega)
│   ├── VCC → 3.3V
│   ├── GND → GND
│   ├── TX  → RX3 (Pin 14)
│   └── RX  → TX3 (Pin 15)
│
├── Boutons (INPUT_PULLUP)
│   ├── BTN1 → Pin 2
│   ├── BTN2 → Pin 3
│   ├── BTN3 → Pin 4
│   ├── BTN4 → Pin 5
│   └── BTN5 → Pin 6
│
├── LED Verte → Pin 7 (+ résistance 220Ω)
├── LED Rouge → Pin 8 (+ résistance 220Ω)
└── Buzzer   → Pin 9
```

## Bibliothèques Arduino Requises

Installer via le gestionnaire de bibliothèques Arduino IDE :

1. **Adafruit Fingerprint Sensor Library** - Pour le capteur AS608
2. **LiquidCrystal I2C** - Pour l'écran LCD
3. **ArduinoJson** (v6+) - Pour parser les réponses JSON du serveur
4. **WiFi** (intégré ESP32) ou **SoftwareSerial** (pour ESP8266)

## Flux de Communication avec l'API

### 1. Vérification d'empreinte

```http
POST /api/arduino/verify-fingerprint
Headers:
  Content-Type: application/json
  X-API-Key: arduino_secure_key_2025

Body:
{
  "empreinte_id": 1,
  "device_id": "ARDUINO_BV_01"
}

Réponse succès:
{
  "success": true,
  "data": {
    "electeur_id": 1,
    "prenom": "Moussa",
    "nom": "Diallo",
    "a_vote": false
  }
}

Réponse erreur:
{
  "success": false,
  "message": "Cet électeur a déjà voté.",
  "code": "DEJA_VOTE"
}
```

### 2. Enregistrement du vote

```http
POST /api/arduino/vote
Headers:
  Content-Type: application/json
  X-API-Key: arduino_secure_key_2025

Body:
{
  "empreinte_id": 1,
  "candidat_id": 3,
  "device_id": "ARDUINO_BV_01"
}

Réponse succès:
{
  "success": true,
  "message": "Vote enregistré avec succès.",
  "code": "VOTE_OK",
  "data": {
    "electeur": "Moussa Diallo",
    "candidat": "Idrissa Seck",
    "hash_vote": "a1b2c3d4..."
  }
}
```

### 3. Liste des candidats

```http
GET /api/arduino/candidats
Headers:
  X-API-Key: arduino_secure_key_2025

Réponse:
{
  "success": true,
  "data": [
    {"id": 1, "prenom": "Bassirou Diomaye", "nom": "Faye", "parti": "PASTEF", "numero_ordre": 1},
    {"id": 2, "prenom": "Amadou", "nom": "Ba", "parti": "BBY", "numero_ordre": 2}
  ]
}
```

## Processus de Vote (Étapes)

1. **Écran d'accueil** : "Placez votre doigt sur le capteur"
2. **Lecture empreinte** : Le capteur scanne l'empreinte
3. **Vérification serveur** : L'API vérifie l'électeur dans la BDD
4. **Affichage candidats** : Les candidats sont affichés sur le LCD
5. **Sélection** : L'électeur appuie sur le bouton correspondant
6. **Confirmation** : "Btn1=OUI Btn5=NON"
7. **Enregistrement** : Le vote est envoyé au serveur
8. **Reçu** : "Merci ! Vote enregistré avec succès"
9. **Retour** : Après 5 secondes, retour à l'écran d'accueil

## Enregistrement des Empreintes

Avant le jour du vote, il faut enregistrer les empreintes des électeurs :

1. L'admin utilise l'API `POST /api/arduino/register-fingerprint`
2. L'empreinte est stockée dans la mémoire du capteur AS608 (jusqu'à 127/162 empreintes)
3. L'ID de l'empreinte est associé à l'électeur dans la base de données

## Tests

Pour tester l'API Arduino sans matériel, utilisez Postman ou curl :

```bash
# Vérifier empreinte
curl -X POST http://localhost:5000/api/arduino/verify-fingerprint \
  -H "Content-Type: application/json" \
  -H "X-API-Key: arduino_secure_key_2025" \
  -d '{"empreinte_id": 1, "device_id": "TEST"}'

# Voter
curl -X POST http://localhost:5000/api/arduino/vote \
  -H "Content-Type: application/json" \
  -H "X-API-Key: arduino_secure_key_2025" \
  -d '{"empreinte_id": 1, "candidat_id": 1, "device_id": "TEST"}'

# Liste candidats
curl -X GET http://localhost:5000/api/arduino/candidats \
  -H "X-API-Key: arduino_secure_key_2025"
```
