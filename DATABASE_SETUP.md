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
