# Base de Données - Initialisation

Ce dossier contient la configuration et l'initialisation de la base de données.

## Configuration

Les paramètres de connexion sont définis dans le fichier `.env` à la racine du projet :

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=projet_pedagogique
NODE_ENV=development
```

## Initialisation de la base de données

Pour créer la base de données et initialiser les tables avec un compte de test :

```bash
npm run db:init
```

Cela va :
1. Créer la base de données (si elle n'existe pas)
2. Créer les tables à partir des modèles Sequelize
3. Insérer un compte de test avec les informations suivantes :
   - **Email** : test@example.com
   - **Mot de passe** (chiffré) : test
   - **Nom** : Compte Test
   - **Bio** : Compte de test pour le développement

## Modèles

Les modèles Sequelize sont définis dans le dossier `src/models/` :

- `Animateur.ts` : Modèle pour les animateurs

## Scripts disponibles

- `npm run db:init` : Initialiser la base de données
