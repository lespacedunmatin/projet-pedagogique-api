const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BACKUP_DIR = path.join(__dirname, '../.db-backup');
const BACKUP_FILE = path.join(BACKUP_DIR, 'backup.sql');
const BACKUP_ENABLED = process.env.BACKUP_DB !== 'false'; // true par défaut, false si BACKUP_DB=false

function getDbCredentials() {
  return {
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'projet_pedagogique',
  };
}

async function globalSetup() {
  // La sauvegarde est optionnelle - elle nécessite mysqldump installé
  if (!BACKUP_ENABLED) {
    return;
  }

  try {
    console.log('\n📦 Sauvegarde de la base de données…');

    // Créer le répertoire de sauvegarde
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const { user, password, host, database } = getDbCredentials();
    const command = `mysqldump -u${user} -p"${password}" -h${host} ${database} > ${BACKUP_FILE} 2>/dev/null`;

    execSync(command, {
      stdio: 'pipe',
      timeout: 30000,
      shell: '/bin/bash',
    });
    console.log('✓ Sauvegarde complétée\n');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la base de données:', error.message);
    console.warn('⚠️ Sauvegarde échouée - tests s\'exécuteront sans restoration\n');
  }
}

async function globalTeardown() {
  // La restauration est optionnelle
  if (!BACKUP_ENABLED) {
    return;
  }

  try {
    // Vérifier que le fichier de sauvegarde existe
    if (!fs.existsSync(BACKUP_FILE)) {
      return;
    }

    console.log('\n📥 Restauration de la base de données...');

    const { user, password, host, database } = getDbCredentials();

    // Supprimer et recréer la base de données
    const createCommand = `mysql -u${user} -p${password} -h${host} -e "DROP DATABASE IF EXISTS ${database}; CREATE DATABASE ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null`;
    execSync(createCommand, {
      stdio: 'pipe',
      timeout: 30000,
      shell: '/bin/bash',
    });

    // Restaurer la sauvegarde
    const restoreCommand = `mysql -u${user} -p${password} -h${host} ${database} < ${BACKUP_FILE} 2>/dev/null`;
    execSync(restoreCommand, {
      stdio: 'pipe',
      timeout: 60000,
      shell: '/bin/bash',
    });

    console.log('✓ Restauration complétée\n');
  } catch (error) {
    // Silencieux - la restauration n'est pas critique
  }
}

module.exports = globalSetup;
