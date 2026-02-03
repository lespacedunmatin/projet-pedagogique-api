-- Script SQL pour créer la base de données et la table Animateur
-- À utiliser si le script d'initialisation Node.js ne fonctionne pas

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `projet_pedagogique`;

-- Créer la table animateurs
CREATE TABLE IF NOT EXISTS `animateurs` (
  `id` CHAR(36) NOT NULL COMMENT 'UUID v4',
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL COMMENT 'SHA256 ou bcrypt',
  `nom` VARCHAR(255) NOT NULL,
  `bio` LONGTEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des animateurs/utilisateurs';
