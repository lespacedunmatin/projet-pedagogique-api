-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `projet_pedagogique`;

-- Création de la table sessions pour stocker les sessions utilisateur
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) NOT NULL,
  expires DATETIME,
  data JSON NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (sid),
  KEY idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour nettoyer les sessions expirées
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM sessions WHERE expires IS NOT NULL AND expires < NOW();
