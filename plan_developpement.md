# Plan de développement détaillé

## Phase 1 : Initialisation et infrastructure (semaine 1)

### 1.1 Configuration du projet
- [x] Initialiser le projet Node.js avec `npm init`
- [x] Installer les dépendances de base (express, dotenv, helmet, cors)
- [x] Configurer les variables d'environnement (`.env`, `.env.example`)
- [x] Mettre en place le fichier `server.js` et la configuration Express
- [ ] Créer la structure de dossiers (`/src`, `/tests`)

### 1.2 Base de données
- [ ] Créer la base de données MariaDB
- [ ] Installer Sequelize et le driver MariaDB
- [ ] Configurer la connexion à la base de données
- [ ] Mettre en place les migrations

### 1.3 Logging et gestion d'erreurs
- [ ] Installer et configurer Winston pour le logging
- [ ] Créer un middleware de gestion globale des erreurs
- [ ] Configurer Helmet pour la sécurité des headers HTTP

### 1.4 Configuration des tests
- [ ] Installer Jest et supertest
- [ ] Créer une base de données de test
- [ ] Configurer les fixtures

---

## Phase 2 : Modèles de données (semaine 1-2)

### 2.1 Créer les modèles Sequelize
- [ ] Modèle `Animateur`
- [ ] Modèle `Projet`
- [ ] Modèle `AnimateurProjet` (liaison)
- [ ] Modèle `Objectif`
- [ ] Modèle `Activite`
- [ ] Modèle `ActiviteObjectif` (liaison)
- [ ] Modèle `Invitation`

### 2.2 Configurer les associations
- [ ] Animateur ↔ Projet (many-to-many via AnimateurProjet)
- [ ] Projet → Objectif (one-to-many)
- [ ] Projet → Activite (one-to-many)
- [ ] Objectif ↔ Activite (many-to-many via ActiviteObjectif)
- [ ] Animateur → Invitation (one-to-many pour `invited_by`)

### 2.3 Créer les migrations
- [ ] Migration pour la table `animateurs`
- [ ] Migration pour la table `projets`
- [ ] Migration pour la table `animateurs_projets`
- [ ] Migration pour la table `objectifs`
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
- [ ] Installer et configurer `bcrypt`
- [ ] Créer un utilitaire de validation des mots de passe (12 car min + 3 types)
- [ ] Créer un utilitaire de hachage/vérification

### 3.3 Routes d'authentification
- [ ] POST `/api/auth/register` - Inscription
- [ ] POST `/api/auth/login` - Connexion
- [ ] POST `/api/auth/logout` - Déconnexion
- [ ] GET `/api/auth/me` - Profil utilisateur

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

## Phase 5 : Routes et contrôleurs - Projets (semaine 3-4)

### 5.1 GET `/api/projets` - Lister les projets
- [ ] Créer le contrôleur `projetController.getAll()`
- [ ] Implémenter le filtrage (include_deleted)
- [ ] Implémenter l'inclusion des animateurs
- [ ] Créer la route
- [ ] Ajouter les tests

### 5.2 GET `/api/projets/:id` - Détails d'un projet
- [ ] Créer le contrôleur `projetController.getById()`
- [ ] Charger les animateurs, objectifs, activités avec leurs objectifs
- [ ] Vérifier les permissions
- [ ] Créer la route
- [ ] Ajouter les tests

### 5.3 POST `/api/projets` - Créer un projet
- [ ] Créer le contrôleur `projetController.create()`
- [ ] Ajouter automatiquement le créateur avec son rôle
- [ ] Validation des dates
- [ ] Créer la route
- [ ] Ajouter les tests

### 5.4 PUT `/api/projets/:id` - Modifier un projet
- [ ] Créer le contrôleur `projetController.update()`
- [ ] Vérifier les permissions
- [ ] Validation des données
- [ ] Créer la route
- [ ] Ajouter les tests

### 5.5 DELETE `/api/projets/:id` - Supprimer un projet
- [ ] Créer le contrôleur `projetController.delete()`
- [ ] Vérifier qu'aucun objectif non supprimé n'existe
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 6 : Gestion des animateurs de projet (semaine 4-5)

### 6.1 Services d'email
- [ ] Installer `nodemailer`
- [ ] Configurer le service d'envoi d'email
- [ ] Créer un template email pour les invitations

### 6.2 POST `/api/projets/:id/animateurs/invite` - Inviter
- [ ] Créer le contrôleur `animateurProjetController.invite()`
- [ ] Vérifier si l'email existe
    - Si oui : créer directement la relation AnimateurProjet
    - Si non : créer une Invitation + envoyer un email
- [ ] Vérifier que l'animateur n'est pas déjà membre
- [ ] Créer la route
- [ ] Ajouter les tests

### 6.3 GET `/api/invitations/:token` - Détails d’une invitation
- [ ] Créer le contrôleur `invitationController.verify()`
- [ ] Vérifier que le token existe et n'a pas expiré
- [ ] Créer la route
- [ ] Ajouter les tests

### 6.4 DELETE `/api/invitations/:token` - Supprimer l’invitation
- [ ] Créer le contrôleur `invitationController.delete()`
- [ ] Vérifier que le token existe et n'a pas expiré
- [ ] Créer la route
- [ ] Ajouter les tests

### 6.5 POST `/api/invitations/:token/accept` - Accepter une invitation
- [ ] Créer le contrôleur `invitationController.accept()`
- [ ] Vérifier que le token existe et n'a pas expiré
- [ ] Si nouveau compte : créer l'animateur avec validation du mdp
- [ ] Si compte existant : vérifier l'authentification
- [ ] Créer la relation AnimateurProjet
- [ ] Marquer l'invitation comme acceptée
- [ ] Créer la route
- [ ] Ajouter les tests

### 6.6 PUT `/api/projets/:projet_id/animateurs/:animateur_id` - Modifier le rôle
- [ ] Créer le contrôleur `animateurProjetController.updateRole()`
- [ ] Vérifier les permissions
- [ ] Créer la route
- [ ] Ajouter les tests

### 6.7 DELETE `/api/projets/:projet_id/animateurs/:animateur_id` - Retirer
- [ ] Créer le contrôleur `animateurProjetController.remove()`
- [ ] Vérifier qu'il reste au moins 1 animateur au projet
- [ ] Soft delete
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 7 : Objectifs pédagogiques (semaine 5)

### 7.1 POST `/api/projets/:projet_id/objectifs` - Créer
- [ ] Créer le contrôleur `objectifController.create()`
- [ ] Vérifier les permissions
- [ ] Validation du texte (non vide)
- [ ] Créer la route
- [ ] Ajouter les tests

### 7.2 PUT `/api/projets/:projet_id/objectifs/:id` - Modifier
- [ ] Créer le contrôleur `objectifController.update()`
- [ ] Vérifier les permissions
- [ ] Créer la route
- [ ] Ajouter les tests

### 7.3 DELETE `/api/projets/:projet_id/objectifs/:id` - Supprimer
- [ ] Créer le contrôleur `objectifController.delete()`
- [ ] Vérifier qu'aucune activité non supprimée n'est liée
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 8 : Activités (semaine 5-6)

### 8.1 POST `/api/projets/:projet_id/activites` - Créer
- [ ] Créer le contrôleur `activiteController.create()`
- [ ] Vérifier les permissions
- [ ] Validation des dates (fin > début)
- [ ] Validation que les dates sont dans la période du projet
- [ ] Créer les liaisons avec les objectifs
- [ ] Créer la route
- [ ] Ajouter les tests

### 8.2 PUT `/api/projets/:projet_id/activites/:id` - Modifier
- [ ] Créer le contrôleur `activiteController.update()`
- [ ] Vérifier les permissions
- [ ] Validation des dates
- [ ] Gérer les liaisons avec objectifs (ajout/suppression)
- [ ] Créer la route
- [ ] Ajouter les tests

### 8.3 DELETE `/api/projets/:projet_id/activites/:id` - Supprimer
- [ ] Créer le contrôleur `activiteController.delete()`
- [ ] Soft delete + enregistrer `deleted_by`
- [ ] Créer la route
- [ ] Ajouter les tests

---

## Phase 9 : Corbeille (semaine 6)

### 9.1 GET `/api/projets/:id/corbeille` - Lister les éléments supprimés
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

**Semaine 1 :** Phases 1 + 2  
**Semaine 2 :** Phases 3 + 4  
**Semaine 3-4 :** Phase 5  
**Semaine 4-5 :** Phase 6  
**Semaine 5-6 :** Phases 7 + 8  
**Semaine 6 :** Phase 9 + 10  
**Semaine 7 :** Phase 11
