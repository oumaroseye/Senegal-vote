-- Remise à zéro complète pour tests (comme si personne n'avait voté)
-- Usage: mysql -u USER -p DATABASE < reset_votes_test.sql
-- Puis: pm2 restart senegal-vote-api  (vide le cache mémoire Arduino: pendingScan)

START TRANSACTION;

-- Tous les bulletins enregistrés
DELETE FROM votes;

-- Compteurs candidats
UPDATE candidats SET nombre_votes = 0;

-- État électeurs (conserve CNI, empreinte, etc.)
UPDATE electeurs
SET a_vote = 0,
    methode_vote = NULL,
    date_vote = NULL;

-- OTP en ligne : repartir proprement (nouveaux envois possibles)
DELETE FROM otps;

-- Totaux sur l'élection (si la colonne est utilisée)
UPDATE elections SET total_votants = 0;

COMMIT;
