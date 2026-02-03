-- Script SQL pour créer l'utilisateur MariaDB avec droits restreints
-- À exécuter avec un compte administrateur (root)

-- 1. Créer l'utilisateur spécifique
CREATE USER IF NOT EXISTS 'app_projet_peda'@'localhost' IDENTIFIED BY 'JeR@swY&LM6Jja!o6hL&';

-- 2. Créer la base de données
CREATE DATABASE IF NOT EXISTS `projet_pedagogique` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Accorder les droits UNIQUEMENT sur la base de données du projet
-- (pas d'accès à d'autres bases)
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, CREATE TEMPORARY TABLES, LOCK TABLES ON `projet_pedagogique`.* TO 'app_projet_peda'@'localhost';

-- 4. Appliquer les changements
FLUSH PRIVILEGES;

-- 5. Vérifier les droits (optionnel)
-- SHOW GRANTS FOR 'app_projet_peda'@'localhost';

-- 6. Créer la table animateurs
USE `projet_pedagogique`;

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

-- Afficher les informations
SELECT '═══════════════════════════════════════════════' as info;
SELECT '✅ Initialisation complète' as status;
SELECT '═══════════════════════════════════════════════' as info;
SELECT 'Utilisateur: app_projet_peda' as credential;
SELECT 'Mot de passe: JeR@swY&LM6Jja!o6hL&' as credential;
SELECT 'Base de données: projet_pedagogique' as credential;
SELECT '' as empty;
