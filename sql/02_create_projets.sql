-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `projet_pedagogique`;

-- Création de la table projets
CREATE TABLE IF NOT EXISTS projets (
  id CHAR(36) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  date_debut DATETIME,
  date_fin DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  PRIMARY KEY (id),
  KEY idx_nom (nom),
  KEY idx_date_debut (date_debut),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Création de la table animateur_projet (table de liaison)
CREATE TABLE IF NOT EXISTS animateur_projet (
  id CHAR(36) NOT NULL,
  animateur_id CHAR(36) NOT NULL,
  projet_id CHAR(36) NOT NULL,
  role VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  PRIMARY KEY (id),
  UNIQUE KEY unique_animateur_projet (animateur_id, projet_id),
  FOREIGN KEY (animateur_id) REFERENCES animateurs (id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (projet_id) REFERENCES projets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_animateur_id (animateur_id),
  KEY idx_projet_id (projet_id),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
