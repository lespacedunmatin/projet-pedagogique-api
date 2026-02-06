-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `projet_pedagogique`;

-- Création de la table activites
CREATE TABLE IF NOT EXISTS activites (
  id CHAR(36) NOT NULL,
  projet_id CHAR(36) NOT NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME NOT NULL,
  responsable_id CHAR(36),
  ordre INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  deleted_at DATETIME,
  deleted_by CHAR(36),
  PRIMARY KEY (id),
  FOREIGN KEY (projet_id) REFERENCES projets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (responsable_id) REFERENCES animateurs (id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES animateurs (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES animateurs (id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (deleted_by) REFERENCES animateurs (id) ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_projet_id (projet_id),
  KEY idx_responsable_id (responsable_id),
  KEY idx_created_by (created_by),
  KEY idx_updated_by (updated_by),
  KEY idx_deleted_at (deleted_at),
  KEY idx_date_debut (date_debut),
  KEY idx_date_fin (date_fin),
  KEY idx_ordre (ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Création de la table activite_objectif (table de liaison many-to-many)
CREATE TABLE IF NOT EXISTS activite_objectif (
  id CHAR(36) NOT NULL,
  activite_id CHAR(36) NOT NULL,
  objectif_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  PRIMARY KEY (id),
  UNIQUE KEY unique_activite_objectif (activite_id, objectif_id),
  FOREIGN KEY (activite_id) REFERENCES activites (id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (objectif_id) REFERENCES objectifs (id) ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_activite_id (activite_id),
  KEY idx_objectif_id (objectif_id),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
