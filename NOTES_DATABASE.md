# Notes de développement - Base de données

## 🎯 Objectif atteint

✅ **Première version de la base de données créée** avec :
- Table `Animateur` créée
- Script d'initialisation automatique
- Configuration Sequelize prête

## 📋 Détails techniques

### Configuration
- **ORM** : Sequelize v6.37.7
- **Base de données** : MariaDB (compatible MySQL)
- **Pool de connexions** : 5 connexions max
- **Modèle de génération d'IDs** : UUID v4

### Modèle Animateur
```typescript
{
  id: UUID (primary key)
  email: string (unique, required)
  password: string (hashed, required)
  nom: string (required)
  bio: string | null (optional)
  created_at: Date (automatic)
  updated_at: Date (automatic)
  deleted_at: Date | null (soft delete)
}
```

## 🚀 Utilisation

### Installation
```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement (.env)
# Les valeurs par défaut sont déjà configurées

# 3. S'assurer que MariaDB est en cours d'exécution
# macOS avec Homebrew: brew services start mariadb
```

### Initialiser la base de données
```bash
# Option 1 : Script bash (recommandé)
./init-db.sh

# Option 2 : Commande npm
npm run db:init

# Option 3 : Manuel
npm run build
node dist/database/init.js
```

### Vérifier
```bash
# Connexion avec MySQL CLI
mysql -u app_projet_peda -p projet_pedagogique

# Liste les tables
SHOW TABLES;

# Affiche les animateurs
SELECT * FROM animateurs;

# Teste la recherche
SELECT * FROM animateurs WHERE email = 'test@example.com';
```

## 🔄 Prochaines étapes

### Immédiatement après
1. Tester `npm run db:init` avec MariaDB actif
2. Créer un premier compte animateur de test
3. Vérifier les données via MySQL CLI

### Court terme (semaine prochaine)
1. Créer les modèles restants :
   - `Projet.ts`
   - `AnimateurProjet.ts`
   - `Objectif.ts`
   - `Activite.ts`
   - `ActiviteObjectif.ts`
   - `Invitation.ts`

2. Configurer les associations Sequelize
3. Créer les migrations si nécessaire

### Moyen terme
1. Implémenter l'authentification
   - POST `/api/auth/register`
   - POST `/api/auth/login`
   - POST `/api/auth/logout`
   - GET `/api/auth/me`

2. Ajouter les validations
   - Email valide et unique
   - Mot de passe fort (12+ chars, 3+ types)
   - Dates cohérentes

3. Implémenter les endpoints CRUD

## ⚙️ Variables d'environnement

Fichier `.env` :
```env
DB_HOST=localhost          # Hôte MariaDB
DB_PORT=3306               # Port MariaDB
DB_USER=app_projet_peda    # Utilisateur MariaDB
DB_PASSWORD=               # Mot de passe (vide par défaut)
DB_NAME=projet_pedagogique # Nom de la BD
NODE_ENV=development       # Environnement
```

## 🔐 Sécurité

### ✅ Implémenté
- Utilisation de UUID pour les IDs (sécurité contre l'énumération)
- Soft delete avec `deleted_at` (conservation des données)
- Validation d'email avec Sequelize validator

### ⚠️ À implémenter
- Remplacement de SHA256 par bcrypt (password hashing sécurisé)
- Validation stricte du mot de passe (12+ chars, 3+ types)
- Rate limiting sur le login
- Sessions sécurisées avec cookies HttpOnly
- CSRF protection
- Validation des entrées utilisateur
- Sanitization des données

## 📊 Structure des fichiers

```
src/
├── database/
│   ├── config.ts          # Configuration Sequelize
│   ├── init.ts            # Script d'initialisation
│   ├── index.ts           # Exports
│   └── README.md          # Documentation
├── models/
│   ├── Animateur.ts       # Modèle Animateur
│   └── index.ts           # Exports
├── server.ts              # Point d'entrée serveur

dist/                      # Compilé TypeScript (généré)
```

## 🐛 Debugging

### Logs détaillés
Pour voir les requêtes SQL, changez `NODE_ENV=production` en `NODE_ENV=development` dans `.env`

### Requête SQL manuelle
```sql
-- Créer la base si elle n'existe pas
CREATE DATABASE IF NOT EXISTS projet_pedagogique CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Se connecter
USE projet_pedagogique;

-- Vérifier les tables
SHOW TABLES;

-- Afficher la structure
DESCRIBE animateurs;

-- Vérifier les données
SELECT id, email, nom, created_at FROM animateurs;
```

## 📚 Ressources

- [Sequelize Documentation](https://sequelize.org/)
- [Sequelize MariaDB](https://sequelize.org/docs/v6/other-topics/dialect-specific-things/)
- [MariaDB Installation macOS](https://mariadb.com/docs/server/install-community-linux-mac/)
- [UUID en MySQL/MariaDB](https://dev.mysql.com/doc/refman/8.0/en/miscellaneous-functions.html#function_uuid)

---

**Créé le :** 2 février 2026
**Dernière mise à jour :** 2 février 2026
