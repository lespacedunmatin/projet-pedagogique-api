# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Aperçu du Projet

API REST pour la gestion de projets pédagogiques dans le cadre de l'éducation populaire (scoutisme, centres de vacances, etc.). Un animateur crée des projets pédagogiques comprenant des objectifs et des activités planifiées, avec possibilité de collaboration entre animateurs.

## Stack Technique

- **Langage**: TypeScript 5.5.3 (CommonJS)
- **Runtime**: Node.js
- **Framework**: Express 5.2.1
- **Base de données**: MariaDB via Sequelize 6.37.7
- **Authentification**: Sessions (cookie-based) avec express-session
- **Sécurité**: Helmet, CORS, bcrypt pour les mots de passe
- **Build**: TypeScript Compiler (tsc)

## Commandes Essentielles

```bash
# Installation
npm install

# Build
npm run build

# Tests (à configurer avec Jest + supertest)
npm test
```

## Architecture et Structure

### Structure des dossiers (prévue selon plan_developpement.md)
```
api/
├── src/
│   ├── config/         # Configuration (DB, env)
│   ├── controllers/    # Logique métier par ressource
│   ├── models/         # Modèles Sequelize
│   ├── routes/         # Définition des routes Express
│   ├── middlewares/    # Auth, validation, error handling
│   ├── utils/          # Fonctions utilitaires
│   ├── services/       # Services (email, etc.)
│   └── server.ts        # Point d'entrée
├── tests/              # Tests unitaires et d'intégration
└── dist/               # Sortie compilée (générée)
```

### Modèle de Données

Le schéma suit une hiérarchie : **Animateur → Projet → Objectif → Activité**

**Tables principales** :
- `animateurs` : Utilisateurs avec email/password, nom, bio
- `projets` : Type (camp/trimestre), dates, description, bilan
- `animateurs_projets` : Association many-to-many avec rôle (directeur, animateur, stagiaire)
- `objectifs` : Objectifs pédagogiques liés à un projet
- `activites` : Activités planifiées avec dates/heures, matériel, bilan
- `activites_objectifs` : Association many-to-many activité ↔ objectif
- `invitations` : Token d'invitation avec expiration (7 jours)
- `sessions` : Gérée automatiquement par connect-session-sequelize

**Principes clés** :
- Tous les IDs sont des UUID
- Soft delete sur tous les modèles (`deleted_at`, `deleted_by`)
- Audit trail : `created_by`, `updated_by`, `created_at`, `updated_at`

### Patterns de Conception

- **Architecture MVC** : Séparation contrôleurs/services/modèles
- **Repository Pattern** : Abstraction de l'accès aux données via Sequelize
- **Service Layer** : Logique métier centralisée (ex: service d'email, validation)
- **Middleware Chain** : Authentification → validation → contrôleur → error handler
- **Factory Pattern** : Création d'objets complexes (invitations)
- **Async/Await** : Toutes les opérations asynchrones

## Règles Métier Importantes

### Permissions
- Tous les endpoints (sauf auth) requièrent authentification
- Accès aux projets : uniquement si l'animateur fait partie du projet (vérifier `AnimateurProjet`)
- Tous les animateurs d'un projet peuvent modifier, inviter, créer objectifs/activités

### Suppressions (Soft Delete)
- Projet : uniquement si aucun objectif non supprimé
- Objectif : uniquement si aucune activité non supprimée liée
- Activité : suppression libre
- Toujours vérifier `deleted_at IS NULL` dans les requêtes

### Validations Critiques
- **Mot de passe** : minimum 12 caractères, au moins 3 types parmi (majuscules, minuscules, chiffres, symboles)
- **Email** : format valide, unique
- **Dates projet** : date_fin >= date_debut
- **Dates activité** : date_heure_fin > date_heure_debut ET dans la période du projet
- **Unicité composée** : (animateur_id, projet_id) et (activite_id, objectif_id)

### Invitations
- Durée : 7 jours
- Si email existe : créer directement `AnimateurProjet`
- Si email n'existe pas : créer invitation + envoyer email avec lien d'inscription pré-rempli

## Sécurité

- **Sessions** : HttpOnly cookies, CSRF protection, expiration après inactivité
- **Bcrypt** : cost factor >= 10
- **Rate limiting** : à implémenter pour tous les endpoints, spécifique pour login
- **Sanitization** : toutes les entrées utilisateur via express-validator
- **Helmet** : sécurité des headers HTTP

## Documentation de Référence

- `api-pedagogique-specs.md` : Spécifications complètes de l'API (modèles, endpoints, règles métier)
- `plan_developpement.md` : Plan de développement détaillé en 11 phases avec checklist

## Point d'Attention

**Le projet est en phase initiale** : seuls les dépendances et la structure de base sont configurés. Suivre le plan de
développement phase par phase pour l'implémentation.

La documentation du projet doit être succincte. Ne pas inclure de longs extraits de code ou de documentation déjà
présents dans d'autres fichiers. Se concentrer sur les informations essentielles pour comprendre et travailler avec le
code.
