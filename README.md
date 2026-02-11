# API de Gestion de Projets Pédagogiques

Une API REST complète pour la gestion de projets pédagogiques, d'objectifs, d'activités et de sessions d'animation.

## 📋 À Propos

Cette API permet de :
- **Gérer les animateurs** - Créer et gérer les comptes des animateurs pédagogiques
- **Créer des projets** - Organiser les projets pédagogiques avec des objectifs et des activités
- **Planifier des activités** - Structurer les activités avec des sessions et des responsables
- **Assigner des objectifs** - Lier des objectifs aux projets
- **Gérer les sessions** - Organiser les sessions d'animation pour chaque activité

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+ 
- **npm** 9+
- **MariaDB** 10.5+ ou **MySQL** 8.0+

### Installation

```bash
# Cloner le projet
git clone <repo-url>
cd api

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres de base de données

# Initialiser la base de données
npm run db:init

# Démarrer le serveur
npm start
```

## 📚 Documentation

### 🎯 Guide de Consommation de l'API (Pour Développeurs et Agents IA)

Consultez [**API_PROJET_PEDAGOGIQUE.md**](./API_PROJET_PEDAGOGIQUE.md) pour :
- **Guide complet** pour développer un client consommant l'API
- Configuration et authentification
- Tous les endpoints avec exemples détaillés
- Patterns et bonnes pratiques de développement
- Gestion des erreurs et codes HTTP
- Exemples de flux métier complets
- Hooks React recommandés
- **Optimisé pour le développement assisté par IA**

### 🔐 Configuration CORS et Sécurité

Consultez [**CORS_SECURITY.md**](./CORS_SECURITY.md) pour :
- Configuration de CORS pour développement et production
- Points de sécurité importants
- Dépannage des erreurs CORS
- Sécurité des sessions et cookies
- Configuration Helmet.js
- Checklist de déploiement production
- **Optimisé pour le développement assisté par IA**

### 📖 Spécifications Techniques de l'API

Consultez [**api-pedagogique-specs.md**](./api-pedagogique-specs.md) pour :
- Tous les endpoints disponibles
- Les modèles de données (Animateur, Projet, Objectif, Activité, etc.)
- Les codes de statut HTTP
- Les règles métier et validations
- Les exemples de requêtes/réponses
- Évolutions futures possibles

### 🗂️ Installation et Configuration de la Base de Données

Consultez [**DATABASE_SETUP.md**](./DATABASE_SETUP.md) pour :
- Installation de MariaDB/MySQL sur macOS, Windows et Linux
- Configuration des variables d'environnement
- Création et initialisation de la base de données
- Guide pour créer un premier animateur
- Troubleshooting des problèmes courants

### 📋 Plan de Développement

Consultez [**plan_developpement.md**](./plan_developpement.md) pour :
- Vue d'ensemble du développement
- Points clés à implémenter
- Progression et statut des fonctionnalités
- Architecture et décisions techniques

### 🔐 Configuration d'un Utilisateur Sécurisé

Consultez [**CLAUDE.md**](./CLAUDE.md) pour :
- Guide de configuration avancée
- Notes et contexte du projet
- Documentation technique détaillée

## 🏗️ Architecture

### Structure du Projet

```
api/
├── src/
│   ├── server.ts              # Point d'entrée de l'application
│   ├── config/                # Configuration (sessions, etc.)
│   ├── database/              # Configuration Sequelize
│   ├── middleware/            # Middleware Express
│   ├── models/                # Modèles Sequelize
│   ├── routes/                # Endpoints de l'API
│   └── types/                 # Déclarations TypeScript
├── sql/                       # Scripts SQL d'initialisation
├── tests/                     # Suite de tests (Jest)
├── bruno/                     # Requêtes Bruno pour l'API
└── DATABASE_SETUP.md          # Guide installation BD
```

### Stack Technique

- **Runtime** : Node.js avec TypeScript
- **Framework** : Express.js
- **ORM** : Sequelize
- **Base de données** : MariaDB/MySQL
- **Tests** : Jest
- **Authentification** : Sessions Express avec bcrypt
- **Validation** : Sequelize + validateurs personnalisés

## 🔐 Authentification

L'API utilise un système de sessions basé sur Express Session avec stockage en base de données.

### Endpoints Authentifiés vs Publics

**Endpoints publics :**
- `GET /status` - Vérifier l'état de l'API
- `POST /auth/register` - Créer un nouvel animateur
- `POST /auth/login` - Se connecter

**Endpoints protégés :**
- Tous les autres endpoints nécessitent une session authentifiée

## 🧪 Tests

### Exécuter les Tests

```bash
# Lancer tous les tests
npm test

# Lancer un fichier de test spécifique
npm test -- animateurs.test.ts

# Avec couverture
npm test -- --coverage
```

### Structure des Tests

- Les tests utilisent une base de données SQLite en mémoire
- Chaque suite de tests configure son propre contexte
- Les tests incluent l'authentification et l'autorisation

## 📡 Exemples d'Utilisation

### Créer un Animateur

```bash
curl -X POST http://localhost:3000/animateurs \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "password": "mot_de_passe_securise"
  }'
```

### Créer un Projet

```bash
curl -X POST http://localhost:3000/projets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "nom": "Projet Biodiversité",
    "description": "Découverte de la biodiversité locale"
  }'
```

### Récupérer les Projets d'un Animateur

```bash
curl http://localhost:3000/animateurs/ANIMATOR_ID/projets \
  -H "Cookie: connect.sid=..."
```

Pour plus d'exemples, consultez les fichiers Bruno dans le dossier `bruno/`.

## 🛠️ Développement

### Variables d'Environnement

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_projet_peda
DB_PASSWORD=votre_mot_de_passe
DB_NAME=projet_pedagogique

# Application
NODE_ENV=development
PORT=3000
SESSION_SECRET=une_clé_secrète_sécurisée
```

### Scripts npm

```bash
# Développement avec rechargement automatique
npm run dev

# Compilation TypeScript
npm run build

# Lancer les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Initialiser la base de données
npm run db:init

# Linter
npm run lint
```

## 📝 Licence

Ce projet est sous licence [MIT](./LICENCE.md). Vous êtes libre de l'utiliser dans des projets commerciaux,
propriétaires ou Open Source. Toute autre licence est envisageable avec l'accord explicite des auteurs.

## 👨‍💼 Auteur

Olivier Gendrin - 2026

### ✨ Réalisation avec l'IA Claude

Ce projet a été développé avec l'assistance de **Claude**, une IA créée par Anthropic. Claude a apporté son aide dans :
- L'architecture et la conception de l'API
- L'implémentation des modèles de données et des routes
- La configuration de la base de données et des tests
- La documentation technique et les guides d'installation
- Les bonnes pratiques de sécurité et d'authentification

Tout ceci sous la supervision et les directives des auteurs, qui ont assuré la cohérence globale du projet.

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
1. Consultez les fichiers de documentation
2. Vérifiez la section Troubleshooting de [DATABASE_SETUP.md](./DATABASE_SETUP.md)
3. Vérifiez les tests pour des exemples d'utilisation

---

**Dernière mise à jour** : Février 2026

