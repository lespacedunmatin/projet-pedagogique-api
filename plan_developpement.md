# Plan de développement détaillé

## Phase 1 : Initialisation et infrastructure (semaine 1)

### 1.1 Configuration du projet
- [x] Initialiser le projet Node.js avec `npm init`
- [x] Installer les dépendances de base (express, dotenv, helmet, cors)
- [x] Configurer les variables d'environnement (`.env`, `.env.example`)
- [x] Mettre en place le fichier `server.js` et la configuration Express
- [x] Créer la structure de dossiers (`/src`, `/tests`)

### 1.2 Base de données
- [x] Créer la base de données MariaDB
- [x] Installer Sequelize et le driver MariaDB
- [x] Configurer la connexion à la base de données
- [ ] Mettre en place les migrations

### 1.3 Configuration des tests
- [x] Installer Jest et supertest
- [x] Créer une base de données de test
- [x] Configurer les fixtures

### 1.4 Logging et gestion d'erreurs
- [ ] Installer et configurer Winston pour le logging
- [ ] Créer un middleware de gestion globale des erreurs
- [ ] Configurer Helmet pour la sécurité des headers HTTP

---

## Phase 2 : Modèles de données (semaine 1-2)

### 2.1 Créer les modèles Sequelize
- [x] Modèle `Animateur` (avec soft delete - deleted_at)
- [x] Modèle `Projet` (avec soft delete - deleted_at)
- [x] Modèle `AnimateurProjet` (liaison, avec soft delete - deleted_at)
- [x] Modèle `Objectif` (avec soft delete - deleted_at)
- [x] Modèle `Activite` (avec soft delete - deleted_at)
- [x] Modèle `ActiviteObjectif` (liaison, avec soft delete - deleted_at)
- [ ] Modèle `Invitation` (avec soft delete - deleted_at)

### 2.2 Configurer les associations
- [x] Animateur ↔ Projet (many-to-many via AnimateurProjet) - Configurée en base de données
- [x] Projet → Objectif (one-to-many)
- [x] Projet → Activite (one-to-many)
- [x] Objectif ↔ Activite (many-to-many via ActiviteObjectif)
- [ ] Animateur → Invitation (one-to-many pour `invited_by`)

### 2.3 Créer les migrations
- [x] Migration pour la table `animateurs`
- [x] Migration pour la table `projets`
- [x] Migration pour la table `animateurs_projets`
- [x] Migration pour la table `objectifs`
- [x] Migration pour la table `activites`
- [x] Migration pour la table `activites_objectifs`
- [ ] Migration pour la table `invitations`

---

## Phase 3 : Authentification (semaine 2)

### 3.1 Configuration des sessions
- [x] Installer `express-session` et `connect-session-sequelize`
- [x] Configurer les sessions avec stockage en base de données
- [x] Configurer les cookies HttpOnly et CSRF protection
- [x] Créer le modèle Session pour la table des sessions
- [x] Créer les middlewares d'authentification (isAuthenticated, isNotAuthenticated)
- [x] Intégrer les sessions au serveur Express
- [x] Créer les types TypeScript pour les sessions
- [x] Créer un événement MySQL pour nettoyer les sessions expirées

### 3.2 Sécurité des mots de passe
- [x] Implémenter la validation forte des mots de passe
  - Au moins 12 caractères
  - Au moins une lettre majuscule
  - Au moins une lettre minuscule
  - Au moins un chiffre
  - Au moins un caractère spécial
- [x] Hachage des mots de passe avec bcrypt

### 3.3 Routes d'authentification
- [x] POST `/auth/register` - Inscription
  - [x] Validation des paramètres (email, mot de passe, nom)
  - [x] Vérification de l'unicité de l'email
  - [x] Validation du format email
  - [x] Validation de la force du mot de passe
  - [x] Hachage du mot de passe
  - [x] Création de la session
  - [x] Tests complets (12 tests)

### 3.2 Sécurité des mots de passe
- [x] Installer et configurer `bcrypt`
- [x] Créer un utilitaire de hachage/vérification
- [ ] Créer un utilitaire de validation des mots de passe (12 char min + 3 types)

### 3.3 Routes d'authentification
- [x] POST `/auth/register` - Inscription
  - [x] Validation des paramètres (email, mot de passe, nom)
  - [x] Vérification de l'unicité de l'email
  - [x] Validation du format email
  - [x] Validation de la force du mot de passe
  - [x] Hachage du mot de passe
  - [x] Création de la session
  - [x] Tests complets (12 tests)
- [x] POST `/auth/login` - Connexion
  - [x] Validation des paramètres (email, mot de passe)
  - [x] Recherche de l'animateur par email
  - [x] Vérification du mot de passe avec bcrypt
  - [x] Vérification que l'animateur n'est pas supprimé
  - [x] Création de la session
  - [x] Tests complets (9 tests)
- [ ] POST `/auth/logout` - Déconnexion
- [ ] GET `/auth/me` - Profil utilisateur

### 3.4 Authentification globale
- [x] Middleware `isAuthenticated` appliqué à toutes les routes (sauf `/status` et `/auth`)
  - [x] Routes `/animateurs`
  - [x] Routes `/projets` et sous-routes
  - [x] Routes `/projets/:id/objectifs`
  - [x] Routes `/projets/:id/activites`
  - [x] Route `/status` accessible sans authentification
  - [x] Routes `/auth` accessible sans authentification

### 3.4 Middlewares d'authentification
- [ ] Middleware `isAuthenticated` (vérifier la session)
- [ ] Middleware `validationRegister` (email unique, mdp valide)
- [ ] Middleware `validationLogin`

---

## Phase 4 : Validations globales (semaine 2-3)

### 4.1 Middleware de validation
- [ ] Installer `express-validator`
- [ ] Créer des validateurs réutilisables
- [ ] Middleware `handleValidationErrors`

### 4.2 Utilitaires de validation métier
- [ ] Validateur pour les dates (fin ≥ début)
- [ ] Validateur pour l'email
- [ ] Validateur pour le type de projet ("trimestre" ou "camp")

---

## Phase 5 : Routes et contrôleurs - Animateurs et Projets (semaine 3-4)

### 5.1 Routes Animateurs - ✅ COMPLÉTÉES
- [x] POST `/animateurs` - Créer un animateur (avec bcrypt)
- [x] GET `/animateurs` - Lister les animateurs (non supprimés)
  - [x] Paramètre optionnel `id_projet` (placeholder pour filtrage futur)
- [x] GET `/animateurs/:id` - Détail d'un animateur
  - [x] Paramètre optionnel `with=projets` pour charger les projets associés
  - [x] Support du soft delete (retourne 410 si supprimé)
- [x] DELETE `/animateurs/:id` - Soft delete (renseigne deleted_at)
- [x] Tous les tests pour ces routes (animateurs.test.ts)

### 5.2 Routes Projets - ✅ PARTIELLEMENT COMPLÉTÉES
- [x] POST `/projets` - Créer un projet avec un animateur initial
  - [x] Validation des dates (debut < fin)
  - [x] Création automatique de la liaison AnimateurProjet
- [x] GET `/projets` - Lister les projets (non supprimés)
- [x] GET `/projets/:id` - Détails d'un projet
  - [x] Charger les liaisons animateur-projet
  - [x] Paramètre optionnel `with=animateurs` pour charger les détails complets des animateurs
  - [x] Support du soft delete
  - [x] Tests complets
- [ ] PUT `/projets/:id` - Modifier un projet
- [ ] DELETE `/projets/:id` - Supprimer un projet (soft delete)
  - [ ] Vérifier qu'aucun objectif non supprimé n'existe
  - [ ] Enregistrer `deleted_by`

---

## Phase 5.3 : Gestion supplémentaire des animateurs par projet

### 5.3 Routes AnimateurProjet
- [x] POST `/projets/:id/animateurs` - Ajouter un animateur à un projet via email
  - [x] Validation de l'email (obligatoire)
  - [x] Vérification que le projet existe et n'est pas supprimé
  - [x] Récupération de l'animateur par email
  - [x] Vérification que l'animateur n'est pas déjà membre du projet
  - [x] Création de la liaison avec rôle optionnel
  - [x] Tests complets (ajout, doublons, erreurs 404, 409)
  - [x] Intégration aux tests projets.test.ts
- [x] GET `/projets/:projet_id/animateurs` - Lister les animateurs d'un projet
  - [x] Récupération de la liste des animateurs non supprimés
  - [x] Support du soft delete (filtrer les animateurs supprimés)
  - [x] Tests complets (liste simple, avec détails, vide, erreurs 404)
  - [x] Tri par date de création
- [ ] PUT `/projets/:projet_id/animateurs/:animateur_id` - Modifier le rôle
- [ ] DELETE `/projets/:projet_id/animateurs/:animateur_id` - Retirer un animateur (soft delete)

---

## Phase 6 : Gestion des animateurs de projet - Invitations (semaine 4-5)

### 6.1 Modèle Invitation
- [ ] Créer le modèle `Invitation`
- [ ] Ajouter les champs token, email_cible, projet_id, projet_nom, code d'expiration
- [ ] Configurer l'association avec Animateur (invited_by)

### 6.2 Services d'email
- [ ] Installer `nodemailer`
- [ ] Configurer le service d'envoi d'email
- [ ] Créer un template email pour les invitations

### 6.3 Routes Invitations
- [ ] POST `/projets/:id/animateurs/invite` - Créer une invitation
  - [ ] Vérifier si l'email existe
    - Si oui : créer directement la relation AnimateurProjet
    - Si non : créer une Invitation + envoyer un email
  - [ ] Vérifier que l'animateur n'est pas déjà membre
- [ ] GET `/invitations/:token` - Vérifier une invitation
- [ ] DELETE `/invitations/:token` - Supprimer l'invitation
- [ ] POST `/invitations/:token/accept` - Accepter l'invitation

---

## Phase 7 : Objectifs pédagogiques (semaine 5)

### 7.1 POST `/projets/:projet_id/objectifs` - Créer
- [x] Créer le contrôleur `objectifController.create()`
- [x] Validation du texte (non vide)
- [x] Validation que le projet existe et n'est pas supprimé
- [x] Validation que l'animateur existe et n'est pas supprimé
- [x] Validation que l'animateur est membre du projet
- [x] Enregistrer `created_by` avec l'ID de l'animateur
- [x] Créer la route
- [x] Ajouter les tests (8 tests: succès, ordre par défaut, texte manquant, animateur_id manquant, projet inexistant, animateur inexistant, animateur non-membre, animateur/projet supprimé)

### 7.2 GET `/projets/:projet_id/objectifs` - Lister
- [x] Créer le contrôleur pour lister les objectifs
- [x] Filtrer les objectifs non supprimés d'un projet (deleted_at = null)
- [x] Trier par ordre puis date de création
- [x] Paramètre optionnel `with=details` pour charger les créateurs/modificateurs
- [x] Vérifier que le projet existe et n'est pas supprimé
- [x] Conserver les objectifs dont le créateur a été supprimé (retourner createdByAnimateur = null)
- [x] Créer la route
- [x] Ajouter les tests (7 tests: liste complète, liste vide, projet inexistant, projet supprimé, avec détails, créateurs supprimés, tri)

### 7.3 PUT `/projets/:projet_id/objectifs/:id` - Modifier
- [ ] Créer le contrôleur `objectifController.update()`
- [ ] Vérifier les permissions
- [ ] Créer la route
- [ ] Ajouter les tests

### 7.4 DELETE `/projets/:projet_id/objectifs/:id` - Supprimer
- [ ] Créer le contrôleur `objectifController.delete()`
- [ ] Vérifier qu'aucune activité non supprimée n'est liée
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 8 : Activités (semaine 5-6)

### 8.1 POST `/projets/:projet_id/activites` - Créer
- [x] Créer le contrôleur pour créer une activité
- [x] Validation du nom (obligatoire)
- [x] Validation des dates (debut < fin)
- [x] Validation que le projet existe et n'est pas supprimé
- [x] Validation que l'animateur existe et n'est pas supprimé
- [x] Validation que l'animateur est membre du projet
- [x] Validation que l'animateur créateur est membre du projet
- [x] Validation que les dates sont dans la période du projet
- [x] Validation que le responsable (optionnel) existe et n'est pas supprimé
- [x] Validation que le responsable est membre du projet
- [x] Enregistrer `created_by` avec l'ID de l'animateur
- [x] Créer la route
- [x] Ajouter les tests (13 tests: succès, sans responsable, champs manquants, dates invalides, projet inexistant, animateur inexistant, responsable inexistant, erreurs de permission, projet supprimé)

### 8.2 GET `/projets/:projet_id/activites` - Lister
- [x] Créer le contrôleur pour lister les activités
- [x] Filtrer les activités non supprimées d'un projet (deleted_at = null)
- [x] Trier par ordre puis date de création
- [x] Paramètre optionnel `with=details` pour charger les créateurs, responsables et modificateurs
- [x] Vérifier que le projet existe et n'est pas supprimé
- [x] Conserver les activités dont le créateur/responsable a été supprimé (retourner null)
- [x] Créer la route
- [x] Ajouter les tests (7 tests: liste complète, liste vide, projet inexistant, projet supprimé, avec détails, créateurs supprimés, tri)

### 8.3 PUT `/projets/:projet_id/activites/:id` - Modifier
- [ ] Créer le contrôleur `activiteController.update()`
- [ ] Vérifier les permissions
- [ ] Validation des dates
- [ ] Gérer les liaisons avec objectifs (ajout/suppression)
- [ ] Créer la route
- [ ] Ajouter les tests

### 8.4 DELETE `/projets/:projet_id/activites/:id` - Supprimer
- [ ] Créer le contrôleur `activiteController.delete()`
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 9 : Corbeille (semaine 6)

### 9.1 GET `/projets/:id/corbeille` - Lister les éléments supprimés
- [ ] Créer le contrôleur `corbeilleController.getTrash()`
- [ ] Récupérer les objectifs supprimés du projet
- [ ] Récupérer les activités supprimées du projet
- [ ] Ajouter les informations du responsable de la suppression
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 10 : Rate limiting et sécurité (semaine 6-7)

### 10.1 Rate limiting
- [ ] Installer `express-rate-limit`
- [ ] Implémenter la limite générale par IP
- [ ] Implémenter une limite spécifique pour le login (protection brute force)

### 10.2 Validation et sanitization
- [ ] Configurer la sanitization des entrées
- [ ] Ajouter des validations strictes pour tous les endpoints

---

## Phase 11 : Documentation et déploiement (semaine 8)

### 11.1 Documentation
- [ ] README complet
- [ ] Guide d'installation et configuration
- [ ] Documentation API (Swagger/OpenAPI optionnel)

### 11.2 Optimisations
- [ ] Revoir les performances des requêtes (n+1 queries)
- [ ] Ajouter des indexes en base de données
- [ ] Profiler les endpoints critiques

### 11.3 Déploiement
- [ ] Configuration production (.env)
- [ ] Configuration des logs
- [ ] Préparation du déploiement

---

## Ordre de priorité recommandé

**Semaine 1 :** Phases 1 + 2 ✅  
**Semaine 2 :** Phases 3 + 4  
**Semaine 3-4 :** Phase 5 (Routes Animateurs ✅, Routes Projets partielles ⚠️)  
**Semaine 4 :** Phase 5.3 + Phase 6  
**Semaine 5-6 :** Phases 7 + 8  
**Semaine 6 :** Phase 9 + 10  
**Semaine 7-8 :** Phase 11

---

## Statut du développement

### ✅ Complété
- Phase 1 : Infrastructure et configuration
- Phase 2 : Modèles de données (Animateur, Projet, AnimateurProjet, Objectif, Activite)
- Phase 2.2 : Associations Sequelize (Animateur-Projet, Projet-Objectif, Projet-Activite, Objectif-Activite)
- Phase 3.1 : Configuration des sessions
  - express-session avec stockage Sequelize
  - Cookies HttpOnly et CSRF protection
  - Middlewares d'authentification
  - Table sessions avec nettoyage automatique
- Phase 3.2 : Sécurité des mots de passe (validation forte + bcrypt)
- Phase 3.3 : Route POST /auth/register (12 tests)
  - Inscription avec validation
  - Établissement de la session
  - Création de l'animateur
- Phase 3.3 : Route POST /auth/login (9 tests)
  - Connexion avec validation
  - Vérification du mot de passe
  - Établissement de la session
- Phase 5.1 : Routes complètes pour Animateurs
  - POST /animateurs
  - GET /animateurs (avec paramètre id_projet)
  - GET /animateurs/:id (avec paramètre with=projets)
  - DELETE /animateurs/:id (soft delete)
  - Tests complets avec support soft delete

### ⚠️ En cours
- Phase 3 : Authentification et sessions
  - ✅ Phase 3.1 : Configuration des sessions (complétée)
  - ✅ Phase 3.2 : Sécurité des mots de passe (complétée)
  - ✅ Phase 3.3 : Routes POST /auth/register et POST /auth/login (complétées)
  - ✅ Phase 3.4 : Authentification globale sur toutes les routes (complétée)
  - ❌ Phase 3.5 : Routes POST /auth/logout et GET /auth/me
- Phase 5.2 : Routes Projets
  - ✅ POST /projets (avec création AnimateurProjet)
  - ✅ GET /projets
  - ✅ GET /projets/:id (avec paramètre with=animateurs)
  - ❌ Reste à faire : PUT/:id, DELETE/:id
- Phase 5.3 : Routes AnimateurProjet
  - ✅ POST /projets/:id/animateurs
  - ✅ GET /projets/:projet_id/animateurs
  - ❌ Reste à faire : PUT/:animateur_id, DELETE/:animateur_id
- Phase 7 : Objectifs pédagogiques
  - ✅ POST /projets/:projet_id/objectifs (8 tests)
  - ✅ GET /projets/:projet_id/objectifs (7 tests)
  - ❌ Reste à faire : PUT/:id, DELETE/:id
- Phase 8 : Activités
  - ✅ POST /projets/:projet_id/activites (13 tests)
  - ✅ GET /projets/:projet_id/activites (7 tests)
  - ❌ Reste à faire : PUT/:id, DELETE/:id

### ❌ À faire
- Phase 3.2 : Sécurité des mots de passe (validation forte)
- Phase 3.3 : Routes d'authentification (register, login, logout, me)
- Phase 3.4 : Middlewares d'authentification
- Phase 4 : Validations globales
- Phase 5.2 : Routes Projets (PUT/:id, DELETE/:id)
- Phase 5.3 : Routes AnimateurProjet (PUT/:animateur_id, DELETE/:animateur_id)
- Phase 6 : Système d'invitations
- Phases 7-11 : Objectifs, activités, corbeille, sécurité, documentation

---

## Problèmes connus

### Tests animateurs.test.ts
- ⚠️ Erreurs concurrentes entre tests avec accès à la base de données
  - Cause : Exécution paralèle des tests ou problèmes de nettoyage
  - Erreur : `Query.run (node_modules/sequelize/src/dialects/mariadb/query.js:47:25)`
  - Solution proposée : 
    - Exécuter les tests en série avec `--runInBand`
    - Améliorer la gestion du pool de connexions
    - Vérifier les hooks before/afterEach

---

## Notes pour les prochaines étapes

1. **Résoudre les problèmes de concurrence des tests** avant de continuer
2. **Implémenter GET /projets/:id** avec chargement des animateurs
3. **Tester la route POST /projets** complètement
4. **Ajouter les tests projets.test.ts**
5. **Commencer Phase 3** : Authentification (sessions avec express-session)

---

## Résumé des implémentations complétées par entité

### ✅ Routes Animateurs
- [x] POST `/animateurs` - Créer un animateur (avec bcrypt)
- [x] GET `/animateurs` - Lister les animateurs (paramètre optionnel id_projet)
- [x] GET `/animateurs/:id` - Détails avec paramètre optionnel `?with=projets`
- [x] DELETE `/animateurs/:id` - Soft delete
- [x] Tests complets (validations, soft delete, permissions)

### ✅ Routes Projets (base)
- [x] POST `/projets` - Créer un projet avec animateur initial
- [x] GET `/projets` - Lister tous les projets
- [x] GET `/projets/:id` - Détails avec paramètre optionnel `?with=animateurs`
- [x] Tests complets (validation dates, soft delete, permissions)

### ✅ Routes Gestion des animateurs par projet
- [x] POST `/projets/:id/animateurs` - Ajouter un animateur via email
- [x] GET `/projets/:projet_id/animateurs` - Lister les animateurs du projet
- [x] Tests complets (8 tests) pour les deux routes

### ✅ Routes Objectifs
- [x] POST `/projets/:projet_id/objectifs` - Créer un objectif
- [x] GET `/projets/:projet_id/objectifs` - Lister les objectifs avec tri et `?with=details`
- [x] Tests complets (15 tests) : création, validation, récupération, suppression des créateurs

### ✅ Routes Activités
- [x] POST `/projets/:projet_id/activites` - Créer une activité
- [x] GET `/projets/:projet_id/activites` - Lister les activités avec tri et `?with=details`
- [x] Validation complète (dates, période du projet, permissions)
- [x] Support du responsable optionnel
- [x] Tests complets (13 + 7 tests) : création et récupération

### ✅ Infrastructure et modèles
- [x] Modèles Sequelize : Animateur, Projet, AnimateurProjet, Objectif
- [x] Associations Sequelize configurées
- [x] Tables SQL avec soft delete (deleted_at)
- [x] Séparation des routes en fichiers modulaires (4 fichiers routes, 4 fichiers tests)
- [x] Chaînes de créateurs/modificateurs (created_by, modified_by, deleted_by)

---

## Architecture des routes et tests

### Organisation des routes Projets
Pour maintenir la maintenabilité et éviter les fichiers trop volumineux, les routes ont été séparées:

- **`src/routes/projets.ts`** (principal):
  - `POST /projets` - Créer un projet
  - `GET /projets` - Lister les projets
  - Intègre les sub-routeurs

- **`src/routes/projets-details.ts`**:
  - `GET /projets/:id` - Détails d'un projet

- **`src/routes/animateurs-projets.ts`**:
  - `POST /projets/:id/animateurs` - Ajouter un animateur
  - `GET /projets/:projet_id/animateurs` - Lister les animateurs

- **`src/routes/objectifs-projets.ts`**:
  - `POST /projets/:projet_id/objectifs` - Créer un objectif

### Organisation des tests
Les tests sont séparés par fonctionnalité:

- **`tests/projets.test.ts`** (agrégateur):
  - Importe tous les fichiers de test spécifiques

- **`tests/projets.create-list.test.ts`**:
  - Tests pour POST et GET /projets

- **`tests/projets.details.test.ts`**:
  - Tests pour GET /projets/:id

- **`tests/animateurs-projets.test.ts`**:
  - Tests pour POST et GET /projets/:id/animateurs

- **`tests/objectifs-projets.test.ts`**:
  - Tests pour POST /projets/:projet_id/objectifs

---

