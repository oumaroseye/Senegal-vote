/*
 * ==========================================
 *  SÉNÉGAL VOTE - Système Arduino
 *  Vote par Empreinte Digitale
 * ==========================================
 * 
 * Matériel requis:
 * - Arduino Mega 2560 (ou ESP32 pour WiFi intégré)
 * - Module empreinte digitale AS608 / R307
 * - Écran LCD I2C 20x4
 * - Module WiFi ESP8266 (si Arduino Mega)
 * - 5 boutons poussoirs (pour sélection candidat)
 * - LEDs (vert = succès, rouge = erreur)
 * - Buzzer
 * 
 * Connexions:
 * - Capteur empreinte: RX2/TX2 (pins 16/17)
 * - LCD I2C: SDA (pin 20), SCL (pin 21)
 * - ESP8266: RX3/TX3 (pins 14/15)
 * - Boutons: pins 2-6
 * - LED verte: pin 7
 * - LED rouge: pin 8
 * - Buzzer: pin 9
 */

#include <Adafruit_Fingerprint.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// ==================== CONFIGURATION ====================
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17
#define ESP_RX 14
#define ESP_TX 15

// Pins des boutons (un par candidat, max 5)
#define BTN_1 2
#define BTN_2 3
#define BTN_3 4
#define BTN_4 5
#define BTN_5 6

// LEDs et Buzzer
#define LED_VERTE 7
#define LED_ROUGE 8
#define BUZZER 9

// Configuration serveur
const char* WIFI_SSID = "Mouhammad";
const char* WIFI_PASS = "Mouh@mm@d12";
const char* SERVER_URL = "http://192.168.1.15:5000";
const char* API_KEY = "arduino_secure_key_2025";
const char* DEVICE_ID = "ARDUINO_BV_01";

// ==================== OBJETS ====================
// Utiliser Serial2 pour le capteur d'empreinte
HardwareSerial fingerSerial(2); // Sur ESP32: Serial2
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerSerial);
LiquidCrystal_I2C lcd(0x27, 20, 4);

// ==================== VARIABLES ====================
int electeurId = -1;
String electeurNom = "";
bool electeurIdentifie = false;
int nombreCandidats = 0;

struct Candidat {
  int id;
  String nom;
  int numero;
};
Candidat candidats[5];

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("=== SENEGAL VOTE - Arduino ===");
  
  // Initialiser LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("  SENEGAL VOTE  ");
  lcd.setCursor(0, 1);
  lcd.print("  Systeme Electoral ");
  lcd.setCursor(0, 2);
  lcd.print("  Initialisation... ");
  
  // Initialiser capteur empreinte
  fingerSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);
  finger.begin(57600);
  
  if (finger.verifyPassword()) {
    Serial.println("Capteur empreinte detecte!");
    lcd.setCursor(0, 3);
    lcd.print("Capteur: OK");
  } else {
    Serial.println("Capteur empreinte NON detecte!");
    lcd.setCursor(0, 3);
    lcd.print("Capteur: ERREUR");
    while(1) delay(1);
  }
  
  // Initialiser pins
  pinMode(BTN_1, INPUT_PULLUP);
  pinMode(BTN_2, INPUT_PULLUP);
  pinMode(BTN_3, INPUT_PULLUP);
  pinMode(BTN_4, INPUT_PULLUP);
  pinMode(BTN_5, INPUT_PULLUP);
  pinMode(LED_VERTE, OUTPUT);
  pinMode(LED_ROUGE, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Connecter WiFi (via ESP8266 ou WiFi intégré ESP32)
  connecterWiFi();
  
  // Charger la liste des candidats depuis le serveur
  chargerCandidats();
  
  delay(2000);
  afficherEcranAccueil();
}

// ==================== BOUCLE PRINCIPALE ====================
void loop() {
  if (!electeurIdentifie) {
    // Phase 1: Attente empreinte
    int empreinteId = lireEmpreinte();
    if (empreinteId >= 0) {
      // Vérifier auprès du serveur
      verifierElecteur(empreinteId);
    }
  } else {
    // Phase 2: Attente choix candidat
    int choix = lireBouton();
    if (choix > 0 && choix <= nombreCandidats) {
      confirmerVote(choix);
    }
  }
  
  delay(100);
}

// ==================== FONCTIONS ====================

void afficherEcranAccueil() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("=== SENEGAL VOTE ===");
  lcd.setCursor(0, 1);
  lcd.print("Placez votre doigt");
  lcd.setCursor(0, 2);
  lcd.print("sur le capteur pour");
  lcd.setCursor(0, 3);
  lcd.print("vous identifier...");
}

int lireEmpreinte() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1;
  
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;
  
  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Empreinte NON");
    lcd.setCursor(0, 1);
    lcd.print("reconnue!");
    
    digitalWrite(LED_ROUGE, HIGH);
    tone(BUZZER, 200, 500);
    delay(2000);
    digitalWrite(LED_ROUGE, LOW);
    
    afficherEcranAccueil();
    return -1;
  }
  
  Serial.print("Empreinte trouvee, ID: ");
  Serial.println(finger.fingerID);
  
  return finger.fingerID;
}

void verifierElecteur(int empreinteId) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Verification...");
  
  // Appeler l'API: POST /api/arduino/verify-fingerprint
  // En pratique, utiliser HTTPClient (ESP32) ou envoyer commande AT à ESP8266
  
  String payload = "{\"empreinte_id\":" + String(empreinteId) + ",\"device_id\":\"" + DEVICE_ID + "\"}";
  String response = httpPost("/api/arduino/verify-fingerprint", payload);
  
  // Parser la réponse JSON
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error || !doc["success"].as<bool>()) {
    String msg = doc["message"] | "Erreur serveur";
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ERREUR:");
    lcd.setCursor(0, 1);
    lcd.print(msg.substring(0, 20));
    
    digitalWrite(LED_ROUGE, HIGH);
    tone(BUZZER, 200, 1000);
    delay(3000);
    digitalWrite(LED_ROUGE, LOW);
    
    afficherEcranAccueil();
    return;
  }
  
  // Électeur identifié
  electeurId = doc["data"]["electeur_id"].as<int>();
  electeurNom = doc["data"]["prenom"].as<String>() + " " + doc["data"]["nom"].as<String>();
  electeurIdentifie = true;
  
  // Bip de succès
  digitalWrite(LED_VERTE, HIGH);
  tone(BUZZER, 1000, 200);
  delay(200);
  tone(BUZZER, 1500, 200);
  
  // Afficher bienvenue + candidats
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Bienvenue,");
  lcd.setCursor(0, 1);
  lcd.print(electeurNom.substring(0, 20));
  delay(2000);
  
  afficherCandidats();
  digitalWrite(LED_VERTE, LOW);
}

void chargerCandidats() {
  // Appeler GET /api/arduino/candidats
  String response = httpGet("/api/arduino/candidats");
  
  StaticJsonDocument<1024> doc;
  deserializeJson(doc, response);
  
  JsonArray arr = doc["data"].as<JsonArray>();
  nombreCandidats = min((int)arr.size(), 5);
  
  for (int i = 0; i < nombreCandidats; i++) {
    candidats[i].id = arr[i]["id"].as<int>();
    candidats[i].nom = arr[i]["prenom"].as<String>() + " " + arr[i]["nom"].as<String>();
    candidats[i].numero = arr[i]["numero_ordre"].as<int>();
  }
  
  Serial.print(nombreCandidats);
  Serial.println(" candidats charges.");
}

void afficherCandidats() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Choisissez (Btn):");
  
  for (int i = 0; i < min(nombreCandidats, 3); i++) {
    lcd.setCursor(0, i + 1);
    lcd.print(String(i + 1) + "." + candidats[i].nom.substring(0, 18));
  }
  
  // Si plus de 3 candidats, scroller ou afficher sur 2 pages
}

int lireBouton() {
  if (digitalRead(BTN_1) == LOW) { delay(200); return 1; }
  if (digitalRead(BTN_2) == LOW) { delay(200); return 2; }
  if (digitalRead(BTN_3) == LOW) { delay(200); return 3; }
  if (digitalRead(BTN_4) == LOW) { delay(200); return 4; }
  if (digitalRead(BTN_5) == LOW) { delay(200); return 5; }
  return 0;
}

void confirmerVote(int choix) {
  int index = choix - 1;
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Vous votez pour:");
  lcd.setCursor(0, 1);
  lcd.print(candidats[index].nom.substring(0, 20));
  lcd.setCursor(0, 2);
  lcd.print("Btn1=OUI  Btn5=NON");
  
  // Attendre confirmation
  while (true) {
    if (digitalRead(BTN_1) == LOW) {
      delay(200);
      enregistrerVote(candidats[index].id);
      return;
    }
    if (digitalRead(BTN_5) == LOW) {
      delay(200);
      afficherCandidats();
      return;
    }
    delay(50);
  }
}

void enregistrerVote(int candidatId) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Enregistrement...");
  
  // Appeler POST /api/arduino/vote
  String payload = "{\"empreinte_id\":" + String(finger.fingerID) + 
                   ",\"candidat_id\":" + String(candidatId) + 
                   ",\"device_id\":\"" + DEVICE_ID + "\"}";
  
  String response = httpPost("/api/arduino/vote", payload);
  
  StaticJsonDocument<512> doc;
  deserializeJson(doc, response);
  
  if (doc["success"].as<bool>()) {
    // Vote réussi!
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("*** MERCI ! ***");
    lcd.setCursor(0, 1);
    lcd.print("Vote enregistre");
    lcd.setCursor(0, 2);
    lcd.print("avec succes!");
    lcd.setCursor(0, 3);
    lcd.print("Bonne journee!");
    
    // Animation succès
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_VERTE, HIGH);
      tone(BUZZER, 1500, 100);
      delay(200);
      digitalWrite(LED_VERTE, LOW);
      delay(100);
    }
    
  } else {
    String msg = doc["message"] | "Erreur";
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ERREUR:");
    lcd.setCursor(0, 1);
    lcd.print(msg.substring(0, 20));
    
    digitalWrite(LED_ROUGE, HIGH);
    tone(BUZZER, 200, 1000);
    delay(3000);
    digitalWrite(LED_ROUGE, LOW);
  }
  
  // Réinitialiser
  electeurIdentifie = false;
  electeurId = -1;
  electeurNom = "";
  
  delay(5000);
  afficherEcranAccueil();
}

// ==================== COMMUNICATION HTTP ====================
// Note: Adapter selon le module utilisé (ESP32 WiFi natif ou ESP8266)

void connecterWiFi() {
  // Pour ESP32:
  // WiFi.begin(WIFI_SSID, WIFI_PASS);
  // while (WiFi.status() != WL_CONNECTED) { delay(500); }
  
  // Pour Arduino + ESP8266 via AT commands:
  // Envoyer commandes AT via Serial3
  Serial.println("WiFi: Connexion en cours...");
  lcd.setCursor(0, 3);
  lcd.print("WiFi: Connexion...");
  
  // Simulation - En production, implémenter la connexion réelle
  delay(1000);
  Serial.println("WiFi: Connecte!");
}

String httpGet(String endpoint) {
  // Implémenter selon le module:
  // ESP32: HTTPClient http; http.begin(SERVER_URL + endpoint);
  // ESP8266: Commandes AT
  
  Serial.println("GET " + String(SERVER_URL) + endpoint);
  
  // Simulation de réponse pour test
  return "{\"success\":true,\"data\":[]}";
}

String httpPost(String endpoint, String payload) {
  // Implémenter selon le module:
  // ESP32:
  // HTTPClient http;
  // http.begin(SERVER_URL + endpoint);
  // http.addHeader("Content-Type", "application/json");
  // http.addHeader("X-API-Key", API_KEY);
  // int httpCode = http.POST(payload);
  // String response = http.getString();
  // http.end();
  // return response;
  
  Serial.println("POST " + String(SERVER_URL) + endpoint);
  Serial.println("Payload: " + payload);
  
  // Simulation
  return "{\"success\":true,\"data\":{}}";
}

// ==================== ENREGISTREMENT EMPREINTE ====================
// Fonction utilitaire pour enregistrer une nouvelle empreinte
// À appeler depuis un mode admin de l'Arduino

void enregistrerNouvelleEmpreinte(int id) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ENREGISTREMENT");
  lcd.setCursor(0, 1);
  lcd.print("Empreinte #" + String(id));
  lcd.setCursor(0, 2);
  lcd.print("Posez le doigt...");
  
  int p = -1;
  
  // Première lecture
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
  }
  
  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) { Serial.println("Erreur conversion 1"); return; }
  
  lcd.setCursor(0, 3);
  lcd.print("Retirez le doigt");
  delay(2000);
  
  lcd.setCursor(0, 3);
  lcd.print("Reposez le doigt  ");
  
  // Deuxième lecture
  p = -1;
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (p == FINGERPRINT_NOFINGER) continue;
  }
  
  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) { Serial.println("Erreur conversion 2"); return; }
  
  // Créer le modèle
  p = finger.createModel();
  if (p != FINGERPRINT_OK) { Serial.println("Erreur creation modele"); return; }
  
  // Stocker
  p = finger.storeModel(id);
  if (p == FINGERPRINT_OK) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Empreinte #" + String(id));
    lcd.setCursor(0, 1);
    lcd.print("ENREGISTREE!");
    
    // Envoyer au serveur
    // httpPost("/api/arduino/register-fingerprint", "{\"electeur_id\":" + String(electeurId) + ",\"empreinte_id\":" + String(id) + "}");
    
    digitalWrite(LED_VERTE, HIGH);
    tone(BUZZER, 1500, 500);
    delay(2000);
    digitalWrite(LED_VERTE, LOW);
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ERREUR stockage!");
    digitalWrite(LED_ROUGE, HIGH);
    delay(2000);
    digitalWrite(LED_ROUGE, LOW);
  }
}
