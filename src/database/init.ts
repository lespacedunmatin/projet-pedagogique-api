import sequelize from '../database/config';
import Animateur from '../models/Animateur';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Objectif from '../models/Objectif';
import Activite from '../models/Activite';
import ActiviteObjectif from '../models/ActiviteObjectif';
import { setupAssociations } from './associations';
import * as crypto from 'crypto';
import { Sequelize } from 'sequelize';

async function createAppUser() {
  // Connexion avec root pour créer l'utilisateur
  const rootSequelize = new Sequelize({
    dialect: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: 'root',
    password: process.env.DB_ROOT_PASSWORD || '',
    logging: false,
  });

  try {
    console.log('Création de l\'utilisateur applicatif…');

    const appUser = process.env.DB_USER;
    const appPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME || 'projet_pedagogique';

    // Créer l'utilisateur s'il n'existe pas
    await rootSequelize.query(`
      CREATE USER IF NOT EXISTS '${appUser}'@'localhost' IDENTIFIED BY '${appPassword}'
    `);

    // Accorder les droits
    await rootSequelize.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, CREATE TEMPORARY TABLES, LOCK TABLES 
      ON \`${dbName}\`.* TO '${appUser}'@'localhost'
    `);

    // Appliquer les changements
    await rootSequelize.query('FLUSH PRIVILEGES');

    console.log(`✓ Utilisateur '${appUser}' créé avec droits restreints à '${dbName}'\n`);
    console.log(`Vous pouvez effacer le mot de passe root dans le fichier .env.\n`);

    await rootSequelize.close();
    return true;
  } catch (error: any) {
    // Si la connexion root échoue, continuer sans créer l'utilisateur
    // (l'utilisateur peut être créé manuellement)
    console.warn('⚠️  Impossible de créer l\'utilisateur automatiquement');
    console.warn('   Vous devrez l\'exécuter manuellement avec: mysql -u root -p < sql/00_create_user.sql');
    console.warn('   Détail erreur:', error.message);
    await rootSequelize.close();
    return false;
  }
}

async function createDatabaseIfNotExists() {
  const sequelizeWithoutDB = new Sequelize({
    dialect: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
  });

  try {
    const dbName = process.env.DB_NAME || 'projet_pedagogique';
    console.log(`Création de la base de données "${dbName}" si elle n'existe pas…`);
    await sequelizeWithoutDB.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✓ Base de données "${dbName}" prête`);
    await sequelizeWithoutDB.close();
  } catch (error) {
    console.error('Erreur lors de la création de la base de données:', error);
    await sequelizeWithoutDB.close();
    throw error;
  }
}

async function initializeDatabase() {
  try {
    console.log('\n=== Initialisation de la Base de Données ===\n');

    // Créer l'utilisateur applicatif (optionnel, peut échouer si pas d'accès root)
    await createAppUser();

    // Créer la base de données si nécessaire
    await createDatabaseIfNotExists();

    console.log('Connexion à la base de données…');
    await sequelize.authenticate();
    console.log('✓ Connexion réussie à la base de données');

    console.log('Configuration des associations…');
    setupAssociations();
    console.log('✓ Associations configurées');

    console.log('Synchronisation des modèles…');
    await sequelize.sync({ alter: true });
    console.log('✓ Modèles synchronisés');

    console.log('✓ Initialisation de la base de données réussie\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Erreur lors de l\'initialisation:', error);
    console.error('\nConsultez DATABASE_SETUP.md pour plus d\'informations sur la configuration.\n');
    process.exit(1);
  }
}

initializeDatabase();
