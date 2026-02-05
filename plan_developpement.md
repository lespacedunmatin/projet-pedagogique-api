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
- [ ] Modèle `Activite` (avec soft delete - deleted_at)
- [ ] Modèle `ActiviteObjectif` (liaison, avec soft delete - deleted_at)
- [ ] Modèle `Invitation` (avec soft delete - deleted_at)

### 2.2 Configurer les associations
- [x] Animateur ↔ Projet (many-to-many via AnimateurProjet) - Configurée en base de données
- [x] Projet → Objectif (one-to-many)
- [ ] Projet → Activite (one-to-many)
- [ ] Objectif ↔ Activite (many-to-many via ActiviteObjectif)
- [ ] Animateur → Invitation (one-to-many pour `invited_by`)

### 2.3 Créer les migrations
- [x] Migration pour la table `animateurs`
- [x] Migration pour la table `projets`
- [x] Migration pour la table `animateurs_projets`
- [x] Migration pour la table `objectifs`
- [ ] Migration pour la table `activites`
- [ ] Migration pour la table `activites_objectifs`
- [ ] Migration pour la table `invitations`

---

## Phase 3 : Authentification (semaine 2)

### 3.1 Configuration des sessions
- [ ] Installer `express-session` et `connect-session-sequelize`
- [ ] Configurer les sessions avec stockage en base de données
- [ ] Configurer les cookies HttpOnly et CSRF protection

### 3.2 Sécurité des mots de passe
- [x] Installer et configurer `bcrypt`
- [x] Créer un utilitaire de hachage/vérification
- [ ] Créer un utilitaire de validation des mots de passe (12 char min + 3 types)

### 3.3 Routes d'authentification
- [ ] POST `/auth/register` - Inscription
- [ ] POST `/auth/login` - Connexion
- [ ] POST `/auth/logout` - Déconnexion
- [ ] GET `/auth/me` - Profil utilisateur

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
- [ ] Créer le contrôleur `objectifController.create()`
- [ ] Vérifier les permissions
- [ ] Validation du texte (non vide)
- [ ] Créer la route
- [ ] Ajouter les tests

### 7.2 PUT `/projets/:projet_id/objectifs/:id` - Modifier
- [ ] Créer le contrôleur `objectifController.update()`
- [ ] Vérifier les permissions
- [ ] Créer la route
- [ ] Ajouter les tests

### 7.3 DELETE `/projets/:projet_id/objectifs/:id` - Supprimer
- [ ] Créer le contrôleur `objectifController.delete()`
- [ ] Vérifier qu'aucune activité non supprimée n'est liée
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 8 : Activités (semaine 5-6)

### 8.1 POST `/projets/:projet_id/activites` - Créer
- [ ] Créer le contrôleur `activiteController.create()`
- [ ] Vérifier les permissions
- [ ] Validation des dates (fin > début)
- [ ] Validation que les dates sont dans la période du projet
- [ ] Créer les liaisons avec les objectifs
- [ ] Créer la route
- [ ] Ajouter les tests

### 8.2 PUT `/projets/:projet_id/activites/:id` - Modifier
- [ ] Créer le contrôleur `activiteController.update()`
- [ ] Vérifier les permissions
- [ ] Validation des dates
- [ ] Gérer les liaisons avec objectifs (ajout/suppression)
- [ ] Créer la route
- [ ] Ajouter les tests

### 8.3 DELETE `/projets/:projet_id/activites/:id` - Supprimer
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
- Phase 2 : Modèles de données (Animateur, Projet, AnimateurProjet, Objectif)
- Phase 2.2 : Associations Sequelize (Animateur-Projet, Projet-Objectif)
- Phase 3.2 : Sécurité des mots de passe avec bcrypt
- Phase 5.1 : Routes complètes pour Animateurs
  - POST /animateurs
  - GET /animateurs (avec paramètre id_projet)
  - GET /animateurs/:id (avec paramètre with=projets)
  - DELETE /animateurs/:id (soft delete)
  - Tests complets avec support soft delete

### ⚠️ En cours
- Phase 5.2 : Routes Projets
  - ✅ POST /projets (avec création AnimateurProjet)
  - ✅ GET /projets
  - ✅ GET /projets/:id (avec paramètre with=animateurs)
  - ❌ Reste à faire : PUT/:id, DELETE/:id
- Phase 5.3 : Routes AnimateurProjet (EN COURS)
  - ✅ POST /projets/:id/animateurs
  - ✅ GET /projets/:projet_id/animateurs
  - ❌ Reste à faire : PUT/:animateur_id, DELETE/:animateur_id

### ❌ À faire
- Phase 3 : Authentification et sessions
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

## Résumé des tâches demandées vs complétées

### Tâches antérieures (complétées)
- ✅ Créer la route GET `/animateurs` avec paramètre optionnel id_projet
- ✅ Créer la route DELETE `/animateurs` avec soft delete
- ✅ Créer la table `projets` et table de liaison `animateurProjet`
- ✅ Ajouter champ deleted_at à `animateurProjet` pour soft delete
- ✅ Créer la route POST `/projets` avec animateur_id et rôle
- ✅ Créer la route GET `/animateurs/:id?with=projets`
- ✅ Tests animateurs.test.ts : Problèmes de concurrence résolus
- ✅ Accès concurrents : Solution implémentée (Jest en série)

### Tâche actuelle (complétée)
- ✅ Créer la route GET `/projets/:id`
- ✅ Ajouter paramètre optionnel `?with=animateurs`
- ✅ Charger les détails complets des animateurs
- ✅ Créer les tests unitaires complets
- ✅ Créer la route POST `/projets/:id/animateurs`
- ✅ Ajouter un animateur à un projet via email
- ✅ Intégrer les tests pour cette route
- ✅ Créer la route GET `/projets/:projet_id/animateurs`
- ✅ Retourner la liste des animateurs d'un projet
- ✅ Ajouter paramètre optionnel `?with=details`
- ✅ Charger les détails complets (sans mot de passe)
- ✅ Créer 6 tests complets (liste simple, avec détails, vide, inexistant, supprimé)
- ✅ Mettre à jour le plan de développement
