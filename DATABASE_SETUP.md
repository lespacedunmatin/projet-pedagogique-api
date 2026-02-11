# API de Gestion de Projets Pédagogiques - Guide d'Installation de la Base de Données

## Prérequis

Avant de démarrer, vous devez installer MariaDB ou MySQL sur votre système.

### Installation sur macOS

#### Avec Homebrew (recommandé)

```bash
# Installer MariaDB
brew install mariadb

# Démarrer le service MariaDB
brew services start mariadb

# Vérifier l'installation
mysql --version
```

#### Avec Docker

```bash
# Créer et démarrer un conteneur MariaDB
docker run --name mariadb -e MYSQL_ROOT_PASSWORD= -p 3306:3306 -d mariadb:latest
```

### Installation sur Windows

#### Avec l'installateur officiel

1. Télécharger l'installateur MSI depuis [mariadb.org/download](https://mariadb.org/download/)
2. Exécuter l'installateur `.msi`
3. Suivre l'assistant d'installation :
   - Accepter les conditions d'utilisation
   - Choisir le chemin d'installation
   - Configurer le port (défaut: 3306)
   - Configurer le mot de passe root
   - Installer en tant que service Windows

4. Vérifier l'installation :

```cmd
mysql --version
```

#### Avec Chocolatey

```powershell
# Installer Chocolatey si nécessaire (en tant qu'administrateur)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Installer MariaDB
choco install mariadb

# Vérifier l'installation
mysql --version
```

#### Avec Docker Desktop

```powershell
# Créer et démarrer un conteneur MariaDB
docker run --name mariadb -e MYSQL_ROOT_PASSWORD=votremotdepasse -p 3306:3306 -d mariadb:latest
```

#### Démarrer/Arrêter le service MariaDB

```powershell
# Démarrer le service
net start MariaDB

# Arrêter le service
net stop MariaDB
```

### Installation sur Linux

#### Sur Debian/Ubuntu

```bash
# Mettre à jour les paquets
sudo apt update
sudo apt upgrade -y

# Installer MariaDB
sudo apt install mariadb-server mariadb-client -y

# Démarrer le service
sudo systemctl start mariadb

# Activer le démarrage automatique
sudo systemctl enable mariadb

# Vérifier l'installation
mysql --version
```

#### Sur Fedora/RHEL/CentOS

```bash
# Installer MariaDB
sudo dnf install mariadb-server mariadb-devel -y

# Démarrer le service
sudo systemctl start mariadb

# Activer le démarrage automatique
sudo systemctl enable mariadb

# Vérifier l'installation
mysql --version
```

#### Sur Arch Linux

```bash
# Installer MariaDB
sudo pacman -S mariadb

# Initialiser la base de données
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql

# Démarrer le service
sudo systemctl start mariadb

# Activer le démarrage automatique
sudo systemctl enable mariadb

# Vérifier l'installation
mysql --version
```

#### Avec Docker

```bash
# Créer et démarrer un conteneur MariaDB
docker run --name mariadb -e MYSQL_ROOT_PASSWORD=votremotdepasse -p 3306:3306 -d mariadb:latest

# Vérifier que le conteneur s'exécute
docker ps
```

#### Gestion du service

```bash
# Vérifier le statut du service
sudo systemctl status mariadb

# Redémarrer le service
sudo systemctl restart mariadb

# Arrêter le service
sudo systemctl stop mariadb
```

## Configuration

### 1. Configurer les variables d'environnement

Modifiez le fichier `.env` à la racine du projet avec vos paramètres de connexion :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_projet_peda
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
DB_NAME=projet_pedagogique
NODE_ENV=development
```

**Note sécurité:** Au lieu d'utiliser le compte `root`, un utilisateur spécifique `app_projet_peda` est utilisé avec des
droits restreints uniquement à la base de données du projet. Voir [SECURE_USER_SETUP.md](./SECURE_USER_SETUP.md) pour plus de détails.

### 2. Créer la base de données (optionnel)

Si le script d'initialisation n'a pas les permissions nécessaires, vous pouvez créer la base de données manuellement :

```sql
CREATE DATABASE IF NOT EXISTS projet_pedagogique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Initialiser la base de données

```bash
npm run db:init
```

Ce script va :
- Créer les tables définies dans les modèles Sequelize
- Insérer un compte de test (si celui-ci n'existe pas)

### 4. Créer un premier animateur via MySQL

Si vous souhaitez créer manuellement un animateur via l'interface MySQL :

#### Générer un UUID et hacher le mot de passe

Avant d'insérer dans la base de données, vous avez besoin :
1. D'un UUID pour l'ID (vous pouvez en générer un ici: https://www.uuidgenerator.net/)
2. D'un mot de passe hashé (utilisez bcrypt)

#### Exemple avec Node.js

Générez rapidement un mot de passe hashé :

```bash
# Installer bcryptjs si ce n'est pas déjà fait
npm install bcryptjs

# Générer un mot de passe hashé dans Node.js
node -e "const bcrypt = require('bcryptjs'); const pwd = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); const hash = bcrypt.hashSync(pwd, 10); console.log('Mot de passe:', pwd); console.log('Hash:', hash);"
```

#### Insérer l'animateur dans MySQL

Une fois que vous avez l'UUID et le hash du mot de passe :

```bash
# Se connecter à MySQL
mysql -u app_projet_peda -p projet_pedagogique

# Ou avec l'utilisateur root
mysql -u root -p projet_pedagogique
```

Dans l'invite MySQL, exécutez :

```sql
INSERT INTO animateurs (id, email, password, nom, bio, created_at, updated_at)
VALUES (
  'VOTRE_UUID_ICI',
  'animateur@example.com',
  'VOTRE_HASH_BCRYPT_ICI',
  'Nom Animateur',
  'Biographie optionnelle',
  NOW(),
  NOW()
);

-- Vérifier l'insertion
SELECT id, email, nom FROM animateurs;
```

**Exemple complet :**

```sql
INSERT INTO animateurs (id, email, password, nom, bio, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'alice@pedagogie.fr',
  '$2a$10$N9qo8uLOickgxc6fH5gZQu7Sh5cO7Q8O4.dZz.Vz8Z5Z5Z5Z5Z5Z5',
  'Alice Dupont',
  'Animatrice pédagogique',
  NOW(),
  NOW()
);
```

#### Récupérer le mot de passe généré

Conservez le mot de passe en clair généré (la première ligne de la sortie) - c'est celui-ci que vous utiliserez pour vous connecter à l'application.

## Structure de la base de données

### Table `animateurs`

Contient les informations des animateurs/utilisateurs de l'application.

| Colonne | Type | Contraintes |
|---------|------|------------|
| id | UUID | PRIMARY KEY, NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| nom | VARCHAR(255) | NOT NULL |
| bio | TEXT | NULL |
| created_at | DATETIME | DEFAULT NOW() |
| updated_at | DATETIME | DEFAULT NOW() |
| deleted_at | DATETIME | NULL (soft delete) |

## Prochaines étapes

- Créer les autres modèles (Projet, Objectif, Activité, etc.)
- Ajouter les associations entre les modèles
- Créer les migrations Sequelize
- Implémenter les endpoints d'authentification

## Troubleshooting

### Erreur de connexion à la base de données

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Vérifiez que MariaDB est en cours d'exécution :

```bash
# Vérifier le statut
brew services list

# Redémarrer si nécessaire
brew services restart mariadb
```

### Erreur de permission

Si vous obtenez une erreur de permission lors de la création de la base de données, vous pouvez :

1. Utiliser un utilisateur avec plus de permissions
2. Créer la base de données manuellement avec vos identifiants administrateur

### Compte de test ne s'insère pas

Vérifiez que la table `animateurs` a été créée correctement :

```sql
SHOW TABLES IN projet_pedagogique;
DESCRIBE animateurs;
```
