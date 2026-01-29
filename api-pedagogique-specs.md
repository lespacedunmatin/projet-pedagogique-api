# API de Gestion de Projets Pédagogiques - Spécifications

## 1. Vue d'ensemble

API REST pour la gestion de projets pédagogiques dans le cadre de l'éducation populaire (scoutisme, centres de vacances, etc.).

**Stack technique :** Node.js / Express
**Authentification :** Sessions (cookie-based)
**Base de données :** MariaDB

### 1.1. Fonctionnalités principales

Un Animateur va créer un Projet Pédagogique, qui comprendra plusieurs Objectifs pédagogiques, qui se déclineront en diverses Activités planifiées. 
L'Animateur pourra inviter d'autres animateurs à collaborer sur le projet.

---

## 2. Modèle de données

La table `sessions` est gérée automatiquement par connect-session-sequelize et n'est pas documentée comme modèle.

### 2.1. Animateur

```json
{
  "id": "UUID",
  "email": "String (unique, requis)",
  "password": "String (chiffré, requis)",
  "nom": "String (requis)",
  "bio": "String (optionnel)",
  "created_at": "DateTime",
  "updated_at": "DateTime",
  "deleted_at": "DateTime (null par défaut)"
}
```

**Règles de validation :**
- Email valide et unique
- Mot de passe : minimum 12 caractères, incluant au moins 3 types de caractères parmi (majuscules, minuscules, chiffres, symboles)

### 2.2. Projet

```json
{
  "id": "UUID",
  "nom": "String (requis)",
  "type": "String (requis)",
  "date_debut": "Date (requis)",
  "date_fin": "Date (requis)",
  "description": "String (optionnel)",
  "bilan": "String (optionnel)",
  "created_at": "DateTime",
  "created_by": "UUID (référence Animateur, requis)",
  "updated_at": "DateTime",
  "deleted_at": "DateTime (null par défaut)",
  "deleted_by": "UUID (référence Animateur, null par défaut)"
}
```
**exemple de types de projet :** "séjour/camp", "trimestre", etc.

**Règles de validation :**
- date_fin >= date_debut
- Suppression possible uniquement si aucun objectif non supprimé

### 2.3. AnimateurProjet (table de liaison)

```json
{
  "id": "UUID",
  "animateur_id": "UUID (référence Animateur, requis)",
  "projet_id": "UUID (référence Projet, requis)",
  "role": "String (optionnel)",
  "date_ajout": "DateTime",
  "deleted_at": "DateTime (null par défaut)"
}
```
**exemple de rôles :** "directeur", "animateur", "stagiaire", etc.
**Règles :**
- Combinaison (animateur_id, projet_id) unique

### 2.4. Objectif Pédagogique

```json
{
  "id": "UUID",
  "projet_id": "UUID (référence Projet, requis)",
  "texte": "String (requis)",
  "commentaire": "String (optionnel)",
  "bilan": "String (optionnel)",
  "created_at": "DateTime",
  "created_by": "UUID (référence Animateur, requis)",
  "updated_at": "DateTime",
  "updated_by": "UUID (référence Animateur, requis)",
  "deleted_at": "DateTime (null par défaut)",
  "deleted_by": "UUID (référence Animateur, null par défaut)"
}
```

**Règles de validation :**
- texte non vide
- Suppression possible uniquement si aucune activité non supprimée liée

### 2.5. Activité

```json
{
  "id": "UUID",
  "projet_id": "UUID (référence Projet, requis)",
  "titre": "String (requis)",
  "description": "String (optionnel)",
  "materiel": "String (optionnel)",
  "bilan": "String (optionnel)",
  "date_heure_debut": "DateTime (requis)",
  "date_heure_fin": "DateTime (requis)",
  "created_at": "DateTime",
  "created_by": "UUID (référence Animateur, requis)",
  "updated_at": "DateTime",
  "updated_by": "UUID (référence Animateur, requis)",
  "deleted_at": "DateTime (null par défaut)",
  "deleted_by": "UUID (référence Animateur, null par défaut)"
}
```

**Règles de validation :**
- date_heure_fin > date_heure_debut
- date_heure_debut et date_heure_fin dans la période du projet

### 2.6. ActiviteObjectif (table de liaison)

```json
{
  "id": "UUID",
  "activite_id": "UUID (référence Activité, requis)",
  "objectif_id": "UUID (référence Objectif, requis)"
}
```

**Règles :**
- Combinaison (activite_id, objectif_id) unique
- Supprimé automatiquement si activité ou objectif supprimé

### 2.7. Invitation

```json
{
  "id": "UUID",
  "email": "String (requis)",
  "projet_id": "UUID (référence Projet, requis)",
  "role": "String (optionnel)",
  "token": "String (unique, généré automatiquement)",
  "invited_by": "UUID (référence Animateur, requis)",
  "created_at": "DateTime",
  "expires_at": "DateTime",
  "accepted_at": "DateTime (null par défaut)"
}
```

---

## 3. Endpoints de l'API

### 3.1. Authentification

#### POST `/api/auth/register`
**Description :** Inscription d'un nouvel animateur

**Body :**
```json
{
  "email": "animateur@example.com",
  "password": "motdepasse123",
  "bio": "BAFA, joue de la guitare"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA, joue de la guitare",
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

**Erreurs :**
- 400 : Email invalide ou déjà utilisé
- 400 : Mot de passe trop court

---

#### POST `/api/auth/login`
**Description :** Connexion d'un animateur

**Body :**
```json
{
  "email": "animateur@example.com",
  "password": "motdepasse123"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA, joue de la guitare"
  }
}
```

**Erreurs :**
- 401 : Email ou mot de passe incorrect

---

#### POST `/api/auth/logout`
**Description :** Déconnexion

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

#### GET `/api/auth/me`
**Description :** Récupérer les informations de l'utilisateur connecté

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA, joue de la guitare"
  }
}
```

**Erreurs :**
- 401 : Non authentifié

---

### 3.2. Projets

#### GET `/api/projets`
**Description :** Liste des projets de l'animateur connecté (non supprimés)

**Query params :**
- `include_deleted` (optionnel) : "true" pour inclure les projets supprimés

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nom": "Camp d'été 2025",
      "type": "camp",
      "date_debut": "2025-07-15",
      "date_fin": "2025-07-29",
      "description": "Camp à la montagne",
      "bilan": null,
      "role": "directeur",
      "animateurs": [
        {
          "id": "uuid",
          "email": "animateur@example.com",
          "nom": "Jean Dupont",
          "role": "directeur"
        }
      ],
      "deleted_at": null
    }
  ]
}
```

---

#### GET `/api/projets/:id`
**Description :** Détails d'un projet

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Camp d'été 2025",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne",
    "bilan": "Excellent camp, très bonne météo",
    "created_by": "uuid",
    "animateurs": [
      {
        "id": "uuid",
        "email": "animateur@example.com",
        "nom": "Jean Dupont",
        "role": "directeur",
        "bio": "Animateur scout"
      }
    ],
    "objectifs": [
      {
        "id": "uuid",
        "texte": "Développer l'autonomie des jeunes",
        "commentaire": "Important pour la croissance personnelle"
      }
    ],
    "activites": [
      {
        "id": "uuid",
        "titre": "Randonnée en montagne",
        "description": "Randonnée de 10km",
        "materiel": "Chaussures de marche, sac à dos, boussole, carte",
        "date_heure_debut": "2025-07-16T09:00:00Z",
        "date_heure_fin": "2025-07-16T17:00:00Z",
        "objectifs": ["uuid"]
      }
    ],
    "deleted_at": null
  }
}
```

**Erreurs :**
- 403 : L'animateur ne fait pas partie de ce projet
- 404 : Projet non trouvé

---

#### POST `/api/projets`
**Description :** Créer un nouveau projet

**Body :**
```json
{
  "nom": "Camp d'été 2025",
  "type": "camp",
  "date_debut": "2025-07-15",
  "date_fin": "2025-07-29",
  "description": "Camp à la montagne",
  "role": "directeur"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Camp d'été 2025",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne",
    "bilan": null,
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

**Note :** L'animateur créateur est automatiquement ajouté au projet avec le rôle spécifié.

**Erreurs :**
- 400 : Données invalides

---

#### PUT `/api/projets/:id`
**Description :** Modifier un projet, y compris restauration depuis la corbeille

**Body :**
```json
{
  "nom": "Camp d'été 2025 - Alpes",
  "description": "Camp à la montagne dans les Alpes",
  "bilan": "Excellent camp"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Camp d'été 2025 - Alpes",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne dans les Alpes",
    "bilan": "Excellent camp",
    "updated_at": "2025-01-28T11:00:00Z"
  }
}
```

**Erreurs :**
- 403 : L'animateur ne fait pas partie de ce projet
- 404 : Projet non trouvé

---

#### DELETE `/api/projets/:id`
**Description :** Supprimer un projet (soft delete)

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Projet supprimé"
}
```

**Erreurs :**
- 400 : Le projet contient des objectifs non supprimés
- 403 : L'animateur ne fait pas partie de ce projet
- 404 : Projet non trouvé

---

#### POST `/api/projets/:id/restore`
**Description :** Restaurer un projet supprimé

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Camp d'été 2025",
    "deleted_at": null
  }
}
```

---

### 3.3. Animateurs de projet

#### POST `/api/projets/:id/animateurs/invite`
**Description :** Inviter un animateur par email

**Body :**
```json
{
  "email": "nouveau@example.com",
  "nom": "Jean Dupont",
  "role": "animateur"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Invitation envoyée",
  "data": {
    "invitation_id": "uuid",
    "email": "nouveau@example.com",
    "nom": "Jean Dupont"
  }
}
```

**Note :**
- Si l'email existe déjà : crée directement la relation AnimateurProjet
- Si l'email n'existe pas : crée une invitation et envoie un email avec le lien d'inscription

**Erreurs :**
- 403 : L'animateur ne fait pas partie de ce projet
- 400 : L'animateur est déjà membre du projet

---

#### POST `/api/invitations/:token/accept`
**Description :** Accepter une invitation (finalise l'inscription si nécessaire)

**Body (si nouveau compte) :**
```json
{
  "password": "motdepasse123",
  "bio": "Nouvel animateur"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Invitation acceptée",
  "data": {
    "projet": {
      "id": "uuid",
      "nom": "Camp d'été 2025"
    }
  }
}
```

**Erreurs :**
- 404 : Invitation non trouvée ou expirée
- 400 : Invitation déjà acceptée

---

#### PUT `/api/projets/:projet_id/animateurs/:animateur_id`
**Description :** Modifier le rôle d'un animateur

**Body :**
```json
{
  "role": "directeur adjoint"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "animateur_id": "uuid",
    "role": "directeur adjoint"
  }
}
```

---

#### DELETE `/api/projets/:projet_id/animateurs/:animateur_id`
**Description :** Retirer un animateur du projet (soft delete)

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Animateur retiré du projet"
}
```

**Erreurs :**
- 400 : Impossible de retirer le dernier animateur d'un projet

---

### 3.4. Objectifs pédagogiques

#### POST `/api/projets/:projet_id/objectifs`
**Description :** Créer un objectif pédagogique

**Body :**
```json
{
  "texte": "Développer l'autonomie des jeunes",
  "commentaire": "Important pour la croissance personnelle"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projet_id": "uuid",
    "texte": "Développer l'autonomie des jeunes",
    "commentaire": "Important pour la croissance personnelle",
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

---

#### PUT `/api/projets/:projet_id/objectifs/:id`
**Description :** Modifier un objectif, y compris restauration depuis la corbeille

**Body :**
```json
{
  "texte": "Développer l'autonomie et la responsabilité des jeunes",
  "commentaire": "Inclure des activités de prise de décision",
  "bilan": "Objectif atteint grâce aux jeux de rôle"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "texte": "Développer l'autonomie et la responsabilité des jeunes",
    "commentaire": "Inclure des activités de prise de décision",
    "bilan": "Objectif atteint grâce aux jeux de rôle",
    "updated_at": "2025-01-28T11:00:00Z"
  }
}
```

---

#### DELETE `/api/projets/:projet_id/objectifs/:id`
**Description :** Supprimer un objectif (soft delete)

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Objectif supprimé"
}
```

**Erreurs :**
- 400 : L'objectif est lié à des activités non supprimées

---

#### POST `/api/projets/:projet_id/objectifs/:id/restore`
**Description :** Restaurer un objectif supprimé

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "texte": "Développer l'autonomie des jeunes",
    "deleted_at": null
  }
}
```

---

### 3.5. Activités

#### POST `/api/projets/:projet_id/activites`
**Description :** Créer une activité

**Body :**
```json
{
  "titre": "Randonnée en montagne",
  "description": "Randonnée de 10km avec dénivelé",
  "materiel": "Chaussures de marche, sac à dos, eau",
  "date_heure_debut": "2025-07-16T09:00:00Z",
  "date_heure_fin": "2025-07-16T17:00:00Z",
  "objectif_ids": ["uuid1", "uuid2"]
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projet_id": "uuid",
    "titre": "Randonnée en montagne",
    "description": "Randonnée de 10km avec dénivelé",
    "materiel": "Chaussures de marche, sac à dos, eau",
    "bilan": null,
    "date_heure_debut": "2025-07-16T09:00:00Z",
    "date_heure_fin": "2025-07-16T17:00:00Z",
    "objectifs": [
      {
        "id": "uuid1",
        "texte": "Développer l'autonomie"
      }
    ],
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

**Erreurs :**
- 400 : Dates hors de la période du projet
- 400 : date_fin <= date_debut

---

#### PUT `/api/projets/:projet_id/activites/:activite_id`
**Description :** Modifier une activité, y compris restauration depuis la corbeille

**Body :**
```json
{
  "titre": "Grande randonnée en montagne",
  "materiel": "Chaussures de marche, sac à dos, eau, pique-nique",
  "bilan": "Très bonne participation, tous les jeunes ont complété la randonnée. Un kit ampoules aurait été utile.",
  "objectif_ids": ["uuid1", "uuid3"]
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "titre": "Grande randonnée en montagne",
    "materiel": "Chaussures de marche, sac à dos, eau, pique-nique",
    "bilan": "Très bonne participation, tous les jeunes ont complété la randonnée. Un kit ampoules aurait été utile.",
    "updated_at": "2025-01-28T11:00:00Z"
  }
}
```

Permet aussi de restaurer une activité supprimée en utilisant le même endpoint avec les données appropriées.

---

#### DELETE `/api/projets/:projet_id/activites/:activite_id`
**Description :** Supprimer une activité (soft delete)

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Activité supprimée"
}
```

---

### 3.6. Corbeille

#### GET `/api/projets/:id/corbeille`
**Description :** Liste des éléments supprimés d'un projet

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "objectifs": [
      {
        "id": "uuid",
        "texte": "Objectif supprimé",
        "deleted_at": "2025-01-27T10:00:00Z",
        "deleted_by": {
          "id": "uuid",
          "email": "animateur@example.com",
          "nom": "Jean Dupont"
        }
      }
    ],
    "activites": [
      {
        "id": "uuid",
        "titre": "Activité supprimée",
        "deleted_at": "2025-01-27T11:00:00Z",
        "deleted_by": {
          "id": "uuid",
          "email": "animateur@example.com",
          "nom": "Jean Dupont"
        }
      }
    ]
  }
}
```

---

## 4. Règles métier

### 4.1. Permissions

- Un animateur ne peut accéder qu'aux projets auxquels il participe
- **Modification de projet** : Tous les animateurs du projet
- **Gestion des animateurs** : Tous les animateurs du projet
  - Inviter : ✅ Oui
  - Changer un rôle : ✅ Oui
  - Retirer : ✅ Oui (sauf lui-même si dernier animateur)
  - Se retirer soi-même : ✅ Oui (si d'autres animateurs existent)
- **Création/suppression d'objectifs/activités** : Tous les animateurs
- **Restauration depuis la corbeille** : Tous les animateurs

### 4.2. Suppressions
- **Soft delete** pour tous les éléments (projets, objectifs, activités, relations animateur-projet)
- Les suppressions enregistrent `deleted_at` et `deleted_by`
- Suppressions conditionnelles :
  - Projet : uniquement si aucun objectif non supprimé
  - Objectif : uniquement si aucune activité non supprimée
  - Activité : suppression libre
- Restauration possible depuis la corbeille

### 4.3. Invitations
- Durée de validité : 7 jours
- Si l'email existe : création directe de la relation AnimateurProjet
- Si l'email n'existe pas : création d'une invitation + email avec lien d'inscription
- Le lien d'inscription pré-remplit l'email et ajoute automatiquement au projet après création du compte

### 4.4. Validation des dates
- Projet : date_fin >= date_debut
- Activité : date_heure_fin > date_heure_debut
- Activité : dates comprises dans la période du projet

### 4.5. Validations métier récurrentes

- **Email** : Format valide, unique (sauf pour invitations)
- **Permissions** : Vérifier l'authentification ET l'accès au projet
- **Soft delete** : Toujours vérifier `deleted_at IS NULL` dans les requêtes
- **Unicité composée** : (animateur_id, projet_id) et (activite_id, objectif_id)

---

## 5. Codes d'erreur standards

- **200** : Succès
- **201** : Création réussie
- **400** : Requête invalide (validation échouée)
- **401** : Non authentifié
- **403** : Accès interdit (permissions insuffisantes)
- **404** : Ressource non trouvée
- **409** : Conflit (ex: email déjà utilisé)
- **500** : Erreur serveur

**Format des erreurs :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": {
      "email": "Email déjà utilisé"
    }
  }
}
```

---

## 6. Sécurité

### 6.1. Authentification
- Sessions avec cookies HttpOnly
- CSRF protection
- Expiration de session après inactivité

### 6.2. Mots de passe
- Hachage avec bcrypt (cost factor >= 10)
- Validation : minimum 12 caractères, incluant au moins 3 types de caractères parmi (majuscules, minuscules, chiffres, symboles)

### 6.3. Rate limiting
- Limite de requêtes par IP
- Protection contre les attaques par force brute sur le login

### 6.4. Validation des entrées
- Sanitization de toutes les entrées utilisateur
- Validation des types de données
- Protection contre les injections SQL/NoSQL

---

## 7. Évolutions futures possibles

- Bibliothèque d'activités réutilisables (templates)
- Duplication d'activité vers un autre projet
- Notifications par email (rappels d'activités, invitations)
- Upload de fichiers (photos, documents)
- Statistiques et tableaux de bord
- Commentaires sur les activités
- Gestion des stocks de matériel (consommable/réutilisable)

---

## 8. Notes d'implémentation

### 8.1. Base de données recommandée
- **MariaDB**
- Utilisation de UUID pour les IDs
- Index sur les clés étrangères et les champs de recherche fréquents

### 8.2. Structure du projet Node.js/Express
```
/api-pedagogique
  /src
    /config         # Configuration (DB, env)
    /controllers    # Logique métier
    /models         # Modèles de données
    /routes         # Définition des routes
    /middlewares    # Auth, validation, error handling
    /utils          # Fonctions utilitaires
    /services       # Services (email, etc.)
  /tests            # Tests unitaires et d'intégration
  server.js         # Point d'entrée
```

### 8.3. Packages recommandés
- `express` : framework web
- `express-session` : gestion des sessions
- `bcrypt` : hachage des mots de passe
- `sequelize` : ORM pour MariaDB/PostgreSQL
- `express-validator` : validation des données
- `nodemailer` : envoi d'emails
- `helmet` : sécurité HTTP headers
- `cors` : gestion CORS
- `dotenv` : variables d'environnement
- `winston` : logging

---

### 8.4. Tests
- Tests unitaires pour les contrôleurs et services
- Tests d'intégration pour les endpoints API
- Utilisation de `jest` et `supertest`

---

### 8.5. Patterns de conception

- **MVC** : Séparation contrôleurs/services/modèles
- **Repository** : Abstraction accès aux données
- **Service Layer** : Logique métier centralisée
- **Middleware** : Auth, validation, gestion erreurs
- **Dependency Injection** : Faciliter les tests
- **Factory** : Création d'objets complexes (invitations)
- **Singleton** : Services partagés (email, logger)
- **Async/Await** : Gestion des opérations asynchrones
- **Principes** : SOLID, KISS, DRY, TDD

---

### 8.6. Documentation de l'API

- **Format** : OpenAPI/Swagger ou Postman
- **Contenu** : Endpoints, paramètres, réponses avec exemples
- **Guides** : Installation, authentification, cas d'usage courants
- **Maintenance** : Changelog, versioning, processus de review
- **Support** : Forum, communauté, notifications de mises à jour

## 9. Exemples de flux utilisateur

### 9.1. Création d'un projet complet
1. POST `/api/projets` → création du projet
2. POST `/api/projets/:id/objectifs` (×3) → ajout des objectifs
3. POST `/api/projets/:id/activites` (×5) → planification des activités avec liens aux objectifs
4. POST `/api/projets/:id/animateurs/invite` → invitation d'un co-animateur

### 9.2. Acceptation d'invitation (nouveau utilisateur)
1. Réception email avec lien `/invitations/:token`
2. POST `/api/invitations/:token/accept` avec password, nom et bio → création compte + ajout au projet
3. GET `/api/projets/:id` → accès au projet

### 9.3. Modification en cours de projet
1. PUT `/api/projets/:id/activites/:id` → modification d'une activité
2. DELETE `/api/projets/:id/activites/:id` → suppression (soft delete)
3. GET `/api/projets/:id/corbeille` → consultation de la corbeille
4. PUT `/api/projets/:id/activites/:id/` → restauration

---

**Version :** 1.0
**Date :** 28 janvier 2026
**Auteur :** Olivier Gendrin
