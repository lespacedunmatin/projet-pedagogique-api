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

function checkDbConnection() {
  try {
    const { user, password, host, database } = getDbCredentials();
    // Tester la connexion à la base de données
    const command = `mysql -u${user} -p"${password}" -h${host} -e "SELECT 1" ${database} 2>/dev/null`;
    execSync(command, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function globalSetup() {
  console.log('\n📋 Initialisation des tests…');

  // Vérifier que la base de données est disponible
  let retries = 3;
  while (retries > 0 && !checkDbConnection()) {
    console.log(`⏳ Attente de la base de données… (${retries} tentatives restantes)`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    retries--;
  }

  if (!checkDbConnection()) {
    console.warn('⚠️ La base de données n\'est pas disponible. Les tests vont continuer sans sauvegarde.');
    return;
  }

  // La sauvegarde est optionnelle - elle nécessite mysqldump installé
  if (!BACKUP_ENABLED) {
    return;
  }

  try {
    console.log('📦 Sauvegarde de la base de données…');

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

module.exports = globalSetup;
