-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `projet_pedagogique`;

-- Création de la table objectifs
CREATE TABLE IF NOT EXISTS objectifs (
  id CHAR(36) NOT NULL,
  projet_id CHAR(36) NOT NULL,
  texte TEXT NOT NULL,
  ordre INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  deleted_at DATETIME,
  deleted_by CHAR(36),
  PRIMARY KEY (id),
  FOREIGN KEY (projet_id) REFERENCES projets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (created_by) REFERENCES animateurs (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES animateurs (id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (deleted_by) REFERENCES animateurs (id) ON DELETE SET NULL ON UPDATE CASCADE,
  KEY idx_projet_id (projet_id),
  KEY idx_created_by (created_by),
  KEY idx_updated_by (updated_by),
  KEY idx_deleted_at (deleted_at),
  KEY idx_ordre (ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
