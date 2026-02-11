# Guide de Consommation de l'API de Gestion de Projets Pédagogiques

## 📖 Introduction

Ce document fournit toutes les instructions nécessaires pour développer un client qui consomme l'API de gestion de
projets pédagogiques. Il est conçu pour être utilisé par des développeurs et des agents IA.

**Version de l'API** : 1.0  
**Date** : 11 février 2026  
**Stack** : Node.js / Express / MariaDB

---

## 📑 Table des Matières

1. **Configuration et Accès**
2. **Authentification**
3. **Endpoints de l'API**
4. **Gestion des Erreurs**
5. **Patterns et Bonnes Pratiques**
   - Flux de développement typique
   - Services Axios (JavaScript)
   - Services Angular complets
   - Guards et intercepteurs
   - Hooks React
6. **Exemples de Flux Métier Complets**
7. **Variables d'Environnement Côté Client**
8. **Tests d'Intégration Client**
9. **Guide Angular Complet**
   - Structure du projet
   - Configuration des environnements
   - Gestion des souscriptions
   - Gestion de l'état
   - Gestion des erreurs globales
   - Exemple d'application complète
10. **Support et Ressources**

---

## 1. Configuration et Accès

### 1.1. Information de Connexion

L'API est accessible via :
- **URL de base** : `http://localhost:3000/api` (développement)
- **URL de production** : À définir selon votre déploiement
- **Port par défaut** : `3000`
- **Protocole** : HTTP/HTTPS

### 1.2. Variables d'Environnement à Configurer

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
SESSION_SECRET=votre_clé_secrète_sécurisée

# CORS - Origines autorisées (séparées par des virgules)
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:3001
```

### 1.3. Démarrage de l'API

```bash
# Installations des dépendances
npm install

# Initialiser la base de données
npm run db:init

# Démarrer l'API
npm start

# Ou en mode développement avec rechargement automatique
npm run dev
```

### 1.4. Configuration CORS (Cross-Origin Resource Sharing)

**CORS** permet à votre client web (Angular, React, etc.) d'accéder à l'API depuis un domaine différent.

#### Configuration en Développement

Par défaut en développement, les origines autorisées sont :
```
http://localhost:3000  (l'API elle-même)
http://localhost:4200  (Client Angular standard)
http://localhost:3001  (Client React standard)
```

#### Configuration en Production

Modifiez la variable `CORS_ORIGIN` dans votre `.env` :

```env
# Production - Un seul domaine
CORS_ORIGIN=https://app.projet-pedagogique.com

# Production - Plusieurs domaines
CORS_ORIGIN=https://app.projet-pedagogique.com,https://admin.projet-pedagogique.com,https://api.exemple.com
```

#### Règles Importantes

✅ **Toujours utiliser HTTPS en production**  
✅ **Spécifier les origines exactes** - Ne jamais utiliser `*` en production  
✅ **Inclure le protocole et le port** - `https://exemple.com:443` ou `http://localhost:3000`  
✅ **Séparer les origines par des virgules** sans espaces après  
✅ **Configurer `credentials: true`** pour autoriser les cookies (déjà fait)  

#### Dépannage CORS

**Erreur : "Access to XMLHttpRequest blocked by CORS policy"**

1. Vérifier que votre domaine est dans `CORS_ORIGIN`
2. Vérifier que vous utilisez `withCredentials: true` en client
3. Vérifier les **méthodes HTTP** autorisées (GET, POST, PUT, DELETE, PATCH)
4. Vérifier les **headers** autorisés (Content-Type, Authorization)

**Exemple d'erreur CORS :**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/projets' from origin 
'http://localhost:4200' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check
```

**Solution :**
```env
# .env
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

---

## 1.3. Démarrage de l'API

## 2. Authentification

### 2.1. Système d'Authentification

L'API utilise un système de **sessions basées sur les cookies** (HttpOnly).

**Caractéristiques :**
- Cookies HttpOnly : Non accessibles depuis JavaScript
- CSRF protection : Incluse
- Expiration après inactivité : Configurable
- Stockage en base de données via `connect-session-sequelize`

### 2.2. Flux d'Authentification

#### Inscription (Register)

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "animateur@example.com",
  "nom": "Jean Dupont",
  "password": "MotDePasse123!@#"
}
```

**Validation du mot de passe :**
- Minimum 12 caractères
- Au moins 3 types de caractères parmi : majuscules, minuscules, chiffres, symboles

**Réponse 201 (Succès) :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": null,
    "created_at": "2026-02-11T10:00:00Z"
  }
}
```

**Erreurs possibles :**
- `400` : Email invalide ou déjà utilisé
- `400` : Mot de passe trop court ou format invalide

#### Connexion (Login)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "animateur@example.com",
  "password": "MotDePasse123!@#"
}
```

**Réponse 200 (Succès) :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": null
  }
}
```

**Cookie défini automatiquement :**
```
Set-Cookie: connect.sid=s%3A....; Path=/; HttpOnly; SameSite=Lax
```

**Erreurs possibles :**
- `401` : Email ou mot de passe incorrect

#### Récupération de l'Utilisateur Connecté

```http
GET /api/auth/me
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA depuis 5 ans"
  }
}
```

**Erreurs possibles :**
- `401` : Non authentifié

#### Déconnexion (Logout)

```http
POST /api/auth/logout
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "message": "Déconnexion réussie"
}
```

**Note** : Le cookie de session est automatiquement effacé par le serveur.

#### Récupérer l'Utilisateur Connecté

```http
GET /auth/me
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "animateur": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA depuis 5 ans",
    "created_at": "2026-02-11T09:00:00Z",
    "updated_at": "2026-02-11T09:00:00Z"
  }
}
```

**Erreurs possibles :**
- `401` : Non authentifié ou compte supprimé

**JavaScript/Fetch :**
```javascript
// Envoyer les cookies automatiquement
fetch('http://localhost:3000/api/projets', {
  credentials: 'include'  // Important !
})
```

**Axios :**
```javascript
const instance = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true  // Important !
})
```

**React :**
```javascript
// Avec fetch
const response = await fetch('/api/projets', {
  credentials: 'include'
})

// Avec Axios
axios.defaults.withCredentials = true
```

**Angular :**
```typescript
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getProjets() {
    // HttpClient envoie automatiquement les cookies
    // avec les paramètres par défaut d'Angular
    return this.http.get('/api/projets')
  }
}

// Dans app.config.ts (Angular 14+) ou app.module.ts
import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
}

// Ou dans app.module.ts (Angular < 14)
import { HttpClientModule } from '@angular/common/http'

@NgModule({
  imports: [HttpClientModule],
  // …
})
export class AppModule {}
```

---

## 3. Endpoints de l'API

### 3.1. Statut de l'API (Public)

```http
GET /api/status
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "API is running"
}
```

**Note** : Cet endpoint est accessible sans authentification.

### 3.2. Animateurs

#### Créer un Animateur

```http
POST /api/animateurs
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "email": "nouvel@example.com",
  "nom": "Alice Durand",
  "password": "SecurePass123!@#",
  "bio": "Animatrice BAFA"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "nouvel@example.com",
    "nom": "Alice Durand",
    "bio": "Animatrice BAFA",
    "created_at": "2026-02-11T10:30:00Z"
  }
}
```

#### Récupérer un Animateur

```http
GET /api/animateurs/:id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA depuis 5 ans",
    "created_at": "2026-02-11T09:00:00Z",
    "updated_at": "2026-02-11T09:00:00Z"
  }
}
```

#### Récupérer les Animateurs Actifs

```http
GET /api/animateurs
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "animateur@example.com",
      "nom": "Jean Dupont",
      "bio": "BAFA depuis 5 ans"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "nouvel@example.com",
      "nom": "Alice Durand",
      "bio": "Animatrice BAFA"
    }
  ]
}
```

#### Mettre à Jour un Animateur

```http
PUT /api/animateurs/:id
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "nom": "Jean Dupont",
  "bio": "BAFA depuis 6 ans, spécialisé en jeux de rôle"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "animateur@example.com",
    "nom": "Jean Dupont",
    "bio": "BAFA depuis 6 ans, spécialisé en jeux de rôle",
    "updated_at": "2026-02-11T11:00:00Z"
  }
}
```

#### Supprimer un Animateur

```http
DELETE /api/animateurs/:id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Animateur supprimé"
}
```

### 3.3. Projets

#### Lister les Projets de l'Utilisateur

```http
GET /api/projets
Cookie: connect.sid=s%3A....
```

**Paramètres optionnels :**
- `include_deleted=true` : Inclure les projets supprimés

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "nom": "Camp d'été 2025",
      "type": "camp",
      "date_debut": "2025-07-15",
      "date_fin": "2025-07-29",
      "description": "Camp à la montagne",
      "bilan": null,
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "role": "directeur",
      "animateurs": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "email": "animateur@example.com",
          "nom": "Jean Dupont",
          "role": "directeur"
        }
      ],
      "created_at": "2026-02-11T10:00:00Z",
      "deleted_at": null
    }
  ]
}
```

#### Créer un Projet

```http
POST /api/projets
Content-Type: application/json
Cookie: connect.sid=s%3A....

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
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "nom": "Camp d'été 2025",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne",
    "bilan": null,
    "created_at": "2026-02-11T10:00:00Z"
  }
}
```

**Note** : L'animateur créateur est automatiquement ajouté au projet avec le rôle spécifié.

#### Récupérer les Détails d'un Projet

```http
GET /api/projets/:id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "nom": "Camp d'été 2025",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne",
    "bilan": "Excellent camp, très bonne météo",
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "animateurs": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "animateur@example.com",
        "nom": "Jean Dupont",
        "role": "directeur",
        "bio": "BAFA depuis 5 ans"
      }
    ],
    "objectifs": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "texte": "Développer l'autonomie des jeunes",
        "commentaire": "Important pour la croissance personnelle",
        "bilan": "Objectif partiellement atteint",
        "created_by": "550e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-02-11T10:15:00Z",
        "deleted_at": null
      }
    ],
    "activites": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "titre": "Randonnée en montagne",
        "description": "Randonnée de 10km",
        "materiel": "Chaussures de marche, sac à dos",
        "bilan": "Tous les jeunes ont complété la randonnée",
        "date_heure_debut": "2025-07-16T09:00:00Z",
        "date_heure_fin": "2025-07-16T17:00:00Z",
        "objectifs": [
          {
            "id": "770e8400-e29b-41d4-a716-446655440000",
            "texte": "Développer l'autonomie des jeunes"
          }
        ],
        "created_by": "550e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-02-11T10:20:00Z",
        "deleted_at": null
      }
    ],
    "created_at": "2026-02-11T10:00:00Z",
    "deleted_at": null
  }
}
```

#### Mettre à Jour un Projet

```http
PUT /api/projets/:id
Content-Type: application/json
Cookie: connect.sid=s%3A....

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
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "nom": "Camp d'été 2025 - Alpes",
    "type": "camp",
    "date_debut": "2025-07-15",
    "date_fin": "2025-07-29",
    "description": "Camp à la montagne dans les Alpes",
    "bilan": "Excellent camp",
    "updated_at": "2026-02-11T11:00:00Z"
  }
}
```

#### Supprimer un Projet

```http
DELETE /api/projets/:id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Projet supprimé"
}
```

**Erreurs possibles :**
- `400` : Le projet contient des objectifs non supprimés
- `403` : L'animateur ne fait pas partie du projet

#### Restaurer un Projet

```http
POST /api/projets/:id/restore
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "nom": "Camp d'été 2025",
    "deleted_at": null
  }
}
```

### 3.4. Animateurs d'un Projet

#### Ajouter un Animateur à un Projet

```http
POST /api/projets/:projet_id/animateurs
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "animateur_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "animateur"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "animateur_id": "550e8400-e29b-41d4-a716-446655440001",
    "projet_id": "660e8400-e29b-41d4-a716-446655440000",
    "role": "animateur",
    "date_ajout": "2026-02-11T11:30:00Z"
  }
}
```

#### Mettre à Jour le Rôle d'un Animateur

```http
PUT /api/projets/:projet_id/animateurs/:animateur_id
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "role": "directeur adjoint"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "animateur_id": "550e8400-e29b-41d4-a716-446655440001",
    "role": "directeur adjoint"
  }
}
```

#### Retirer un Animateur d'un Projet

```http
DELETE /api/projets/:projet_id/animateurs/:animateur_id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Animateur retiré du projet"
}
```

**Erreurs possibles :**
- `400` : Impossible de retirer le dernier animateur

### 3.5. Objectifs Pédagogiques

#### Créer un Objectif

```http
POST /api/projets/:projet_id/objectifs
Content-Type: application/json
Cookie: connect.sid=s%3A....

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
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "projet_id": "660e8400-e29b-41d4-a716-446655440000",
    "texte": "Développer l'autonomie des jeunes",
    "commentaire": "Important pour la croissance personnelle",
    "bilan": null,
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-02-11T10:15:00Z",
    "updated_at": "2026-02-11T10:15:00Z",
    "deleted_at": null
  }
}
```

#### Récupérer les Objectifs d'un Projet

```http
GET /api/projets/:projet_id/objectifs
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "projet_id": "660e8400-e29b-41d4-a716-446655440000",
      "texte": "Développer l'autonomie des jeunes",
      "commentaire": "Important pour la croissance personnelle",
      "bilan": null,
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-11T10:15:00Z",
      "deleted_at": null
    }
  ]
}
```

**Note** : Cette route retourne uniquement les objectifs non supprimés, mais garde les objectifs créés par des animateurs supprimés.

#### Mettre à Jour un Objectif

```http
PUT /api/projets/:projet_id/objectifs/:objectif_id
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "texte": "Développer l'autonomie et la responsabilité",
  "commentaire": "Inclure des activités de prise de décision",
  "bilan": "Objectif atteint grâce aux jeux de rôle"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "texte": "Développer l'autonomie et la responsabilité",
    "commentaire": "Inclure des activités de prise de décision",
    "bilan": "Objectif atteint grâce aux jeux de rôle",
    "updated_at": "2026-02-11T11:00:00Z"
  }
}
```

#### Supprimer un Objectif

```http
DELETE /api/projets/:projet_id/objectifs/:objectif_id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Objectif supprimé"
}
```

**Erreurs possibles :**
- `400` : L'objectif est lié à des activités non supprimées

#### Restaurer un Objectif

```http
POST /api/projets/:projet_id/objectifs/:objectif_id/restore
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "texte": "Développer l'autonomie des jeunes",
    "deleted_at": null
  }
}
```

### 3.6. Activités

#### Créer une Activité

```http
POST /api/projets/:projet_id/activites
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "titre": "Randonnée en montagne",
  "description": "Randonnée de 10km avec dénivelé",
  "materiel": "Chaussures de marche, sac à dos, eau",
  "date_heure_debut": "2025-07-16T09:00:00Z",
  "date_heure_fin": "2025-07-16T17:00:00Z",
  "objectif_ids": ["770e8400-e29b-41d4-a716-446655440000", "770e8400-e29b-41d4-a716-446655440001"]
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "projet_id": "660e8400-e29b-41d4-a716-446655440000",
    "titre": "Randonnée en montagne",
    "description": "Randonnée de 10km avec dénivelé",
    "materiel": "Chaussures de marche, sac à dos, eau",
    "bilan": null,
    "date_heure_debut": "2025-07-16T09:00:00Z",
    "date_heure_fin": "2025-07-16T17:00:00Z",
    "objectifs": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "texte": "Développer l'autonomie des jeunes"
      }
    ],
    "created_by": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-02-11T10:20:00Z",
    "deleted_at": null
  }
}
```

#### Récupérer les Activités d'un Projet

```http
GET /api/projets/:projet_id/activites
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "projet_id": "660e8400-e29b-41d4-a716-446655440000",
      "titre": "Randonnée en montagne",
      "description": "Randonnée de 10km avec dénivelé",
      "materiel": "Chaussures de marche, sac à dos, eau",
      "bilan": null,
      "date_heure_debut": "2025-07-16T09:00:00Z",
      "date_heure_fin": "2025-07-16T17:00:00Z",
      "objectifs": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "texte": "Développer l'autonomie des jeunes"
        }
      ],
      "created_by": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-11T10:20:00Z",
      "deleted_at": null
    }
  ]
}
```

#### Mettre à Jour une Activité

```http
PUT /api/projets/:projet_id/activites/:activite_id
Content-Type: application/json
Cookie: connect.sid=s%3A....

{
  "titre": "Grande randonnée en montagne",
  "materiel": "Chaussures de marche, sac à dos, eau, pique-nique",
  "bilan": "Très bonne participation, tous les jeunes ont complété la randonnée",
  "objectif_ids": ["770e8400-e29b-41d4-a716-446655440000", "770e8400-e29b-41d4-a716-446655440002"]
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "titre": "Grande randonnée en montagne",
    "materiel": "Chaussures de marche, sac à dos, eau, pique-nique",
    "bilan": "Très bonne participation, tous les jeunes ont complété la randonnée",
    "updated_at": "2026-02-11T11:00:00Z",
    "objectifs": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "texte": "Développer l'autonomie des jeunes"
      }
    ]
  }
}
```

#### Supprimer une Activité

```http
DELETE /api/projets/:projet_id/activites/:activite_id
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Activité supprimée"
}
```

#### Restaurer une Activité

```http
POST /api/projets/:projet_id/activites/:activite_id/restore
Cookie: connect.sid=s%3A....
```

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "titre": "Randonnée en montagne",
    "deleted_at": null
  }
}
```

---

## 4. Gestion des Erreurs

### 4.1. Format des Erreurs

Toutes les erreurs suivent le format :

```json
{
  "success": false,
  "error": {
    "code": "CODE_ERREUR",
    "message": "Description lisible de l'erreur",
    "details": {
      "champ": "Message de validation spécifique"
    }
  }
}
```

### 4.2. Codes d'Erreur HTTP

| Code    | Situation             | Exemple                              |
|---------|-----------------------|--------------------------------------|
| **200** | Requête réussie       | Récupération de données              |
| **201** | Création réussie      | Création d'un projet                 |
| **400** | Requête invalide      | Email invalide, champs manquants     |
| **401** | Non authentifié       | Session expirée, pas de cookie       |
| **403** | Accès interdit        | Animateur n'appartient pas au projet |
| **404** | Ressource non trouvée | Projet/Objectif/Activité introuvable |
| **409** | Conflit               | Email déjà utilisé                   |
| **410** | Parti                 | Objet supprimé (peut être rétabli)   |
| **500** | Erreur serveur        | Problème interne du serveur          |

### 4.3. Codes d'Erreur Métier

| Code | Signification |
|------|---------------|
| `VALIDATION_ERROR` | Les données fournies sont invalides |
| `UNAUTHORIZED` | Non authentifié |
| `FORBIDDEN` | Permissions insuffisantes |
| `NOT_FOUND` | Ressource non trouvée |
| `CONFLICT` | Ressource déjà existante |
| `BUSINESS_RULE_ERROR` | Règle métier violée |
| `INTERNAL_SERVER_ERROR` | Erreur serveur |

### 4.4. Exemples d'Erreurs

**Validation échouée (400) :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": {
      "email": "Email invalide",
      "password": "Le mot de passe doit contenir au moins 12 caractères"
    }
  }
}
```

**Non authentifié (401) :**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Vous devez être authentifié pour accéder à cette ressource"
  }
}
```

**Accès interdit (403) :**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Vous n'avez pas les permissions pour accéder à ce projet"
  }
}
```

---

## 5. Patterns et Bonnes Pratiques

### 5.1. Flux de Développement Typique

#### 1. Initialisation du Client

```javascript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true  // Important pour les cookies
})

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirection vers login ou refresh de session
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

#### 2. Service d'Authentification

```javascript
const authService = {
  register: async (email, nom, password) => {
    const { data } = await apiClient.post('/auth/register', { 
      email, nom, password 
    })
    return data.data
  },

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { 
      email, password 
    })
    return data.data
  },

  logout: async () => {
    await apiClient.post('/auth/logout')
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data.data
  }
}
```

#### 3. Service de Projets

```javascript
const projectService = {
  list: async (includeDeleted = false) => {
    const { data } = await apiClient.get('/projets', {
      params: { include_deleted: includeDeleted }
    })
    return data.data
  },

  getById: async (id) => {
    const { data } = await apiClient.get(`/projets/${id}`)
    return data.data
  },

  create: async (projectData) => {
    const { data } = await apiClient.post('/projets', projectData)
    return data.data
  },

  update: async (id, projectData) => {
    const { data } = await apiClient.put(`/projets/${id}`, projectData)
    return data.data
  },

  delete: async (id) => {
    await apiClient.delete(`/projets/${id}`)
  },

  restore: async (id) => {
    const { data } = await apiClient.post(`/projets/${id}/restore`)
    return data.data
  }
}
```

### 5.2. Gestion des Erreurs en Client

```javascript
// Pattern try-catch recommandé
async function createProject(projectData) {
  try {
    const project = await projectService.create(projectData)
    console.log('Projet créé:', project)
    return project
  } catch (error) {
    if (error.response?.status === 400) {
      // Erreur de validation
      console.error('Validation:', error.response.data.error.details)
    } else if (error.response?.status === 403) {
      // Accès interdit
      console.error('Accès interdit')
    } else if (error.response?.status === 401) {
      // Non authentifié - redirection
      window.location.href = '/login'
    } else {
      // Erreur serveur
      console.error('Erreur serveur:', error.message)
    }
    throw error
  }
}
```

### 5.3. Pagination et Filtrage

**À implémentation future :**
- Pagination : `GET /api/projets?page=1&limit=10`
- Filtrage : `GET /api/projets?type=camp&archived=false`
- Tri : `GET /api/projets?sort=date_debut&order=desc`

### 5.4. Hooks React (Recommandé)

```javascript
function useProject(projectId) {
  const [project, setProject] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    projectService
      .getById(projectId)
      .then(setProject)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [projectId])

  return { project, loading, error }
}
```

### 5.5. Services Angular (Recommandé)

#### Service d'Authentification Angular

```typescript
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, BehaviorSubject } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { of } from 'rxjs'

export interface Animateur {
  id: string
  email: string
  nom: string
  bio?: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api'
  private currentUserSubject = new BehaviorSubject<Animateur | null>(null)
  public currentUser$ = this.currentUserSubject.asObservable()

  constructor(private http: HttpClient) {
    this.checkCurrentUser()
  }

  register(email: string, nom: string, password: string): Observable<Animateur> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, {
      email,
      nom,
      password
    }).pipe(
      tap(response => {
        this.currentUserSubject.next(response.data)
      }),
      catchError(error => {
        console.error('Erreur registration:', error)
        throw error
      })
    )
  }

  login(email: string, password: string): Observable<Animateur> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.currentUserSubject.next(response.data)
      }),
      catchError(error => {
        console.error('Erreur login:', error)
        throw error
      })
    )
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null)
      })
    )
  }

  getCurrentUser(): Observable<Animateur> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        this.currentUserSubject.next(response.data)
      })
    )
  }

  private checkCurrentUser(): void {
    this.getCurrentUser().pipe(
      catchError(() => of(null))
    ).subscribe()
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      // …existing code…
    )
  }
}
```

#### Service de Projets Angular

```typescript
import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'

export interface Projet {
  id: string
  nom: string
  type: string
  date_debut: string
  date_fin: string
  description: string
  bilan?: string
  created_by: string
  created_at: string
  deleted_at?: string
}

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private apiUrl = 'http://localhost:3000/api/projets'

  constructor(private http: HttpClient) {}

  list(includeDeleted = false): Observable<any> {
    const params = new HttpParams()
      .set('include_deleted', includeDeleted)

    return this.http.get<any>(this.apiUrl, { params })
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
  }

  create(projet: Partial<Projet>): Observable<any> {
    return this.http.post<any>(this.apiUrl, projet)
  }

  update(id: string, projet: Partial<Projet>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, projet)
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
  }

  restore(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/restore`, {})
  }
}
```

#### Service d'Objectifs Angular

```typescript
import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

export interface Objectif {
  id: string
  projet_id: string
  texte: string
  commentaire?: string
  bilan?: string
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

@Injectable({
  providedIn: 'root'
})
export class ObjectifService {
  private apiUrl = 'http://localhost:3000/api/projets'

  constructor(private http: HttpClient) {}

  createObjectif(projetId: string, objectif: Partial<Objectif>): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${projetId}/objectifs`,
      objectif
    )
  }

  getObjectifs(projetId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${projetId}/objectifs`)
  }

  updateObjectif(projetId: string, objectifId: string, objectif: Partial<Objectif>): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${projetId}/objectifs/${objectifId}`,
      objectif
    )
  }

  deleteObjectif(projetId: string, objectifId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${projetId}/objectifs/${objectifId}`
    )
  }

  restoreObjectif(projetId: string, objectifId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${projetId}/objectifs/${objectifId}/restore`,
      {}
    )
  }
}
```

### 5.6. Composants Angular

#### Composant de Connexion

```typescript
import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AuthService } from '../services/auth.service'
import { Router } from '@angular/router'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup
  loading = false
  submitted = false
  error = ''

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    })
  }

  get f() {
    return this.loginForm.controls
  }

  onSubmit(): void {
    this.submitted = true

    if (this.loginForm.invalid) {
      return
    }

    this.loading = true
    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: () => {
          this.router.navigate(['/projets'])
        },
        error: (error) => {
          this.error = error.error?.error?.message || 'Erreur de connexion'
          this.loading = false
        }
      })
  }
}
```

**Template login.component.html :**
```html
<div class="login-container">
  <h2>Connexion</h2>

  @if (error) {
    <div class="alert alert-danger">
      {{ error }}
    </div>
  }

  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label for="email">Email&#8239;:</label>
      <input
        type="email"
        id="email"
        class="form-control"
        formControlName="email"
        [class.is-invalid]="submitted && f['email'].errors"
      />
       @if (submitted && f['email'].errors) {
        <div class="invalid-feedback">
          @if (f['email'].errors['required']) {
            <div>Email requis</div>
          }
          @if (f['email'].errors['email']) {
            <div>Email invalide</div>
          }
        </div>
      }
    </div>

    <div class="form-group">
      <label for="password">Mot de passe&#8239;:</label>
      <input
        type="password"
        id="password"
        class="form-control"
        formControlName="password"
        [class.is-invalid]="submitted && f['password'].errors"
      />
      @if (submitted && f['password'].errors) {
        <div class="invalid-feedback">
          @if (f['password'].errors['required']) {
            <div>Mot de passe requis</div>
          }
        </div>
      }
    </div>

    <button
      type="submit"
      class="btn btn-primary"
      [disabled]="loading"
    >
      {{ loading ? 'Connexion en cours…' : 'Se connecter' }}
    </button>
  </form>
</div>
```

#### Composant de Liste de Projets

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { ProjetService, Projet } from '../services/projet.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'app-projets-list',
  templateUrl: './projets-list.component.html',
  styleUrls: ['./projets-list.component.css']
})
export class ProjetsListComponent implements OnInit, OnDestroy {
  projets: Projet[] = []
  loading = true
  error = ''
  private destroy$ = new Subject<void>()

  constructor(private projetService: ProjetService) {}

  ngOnInit(): void {
    this.loadProjets()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadProjets(): void {
    this.loading = true
    this.projetService.list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.projets = response.data
          this.loading = false
        },
        error: (error) => {
          this.error = error.error?.error?.message || 'Erreur lors du chargement'
          this.loading = false
        }
      })
  }

  deleteProjet(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.projetService.delete(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadProjets()
          },
          error: (error) => {
            this.error = error.error?.error?.message || 'Erreur de suppression'
          }
        })
    }
  }

  restoreProjet(id: string): void {
    this.projetService.restore(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProjets()
        },
        error: (error) => {
          this.error = error.error?.error?.message || 'Erreur de restauration'
        }
      })
  }
}
```

**Template projets-list.component.html :**
```html
<div class="projets-container">
  <h2>Mes Projets</h2>

  @if (error) {
    <div class="alert alert-danger">
      {{ error }}
    </div>
  }

  @if (loading) {
    <div class="spinner">
      Chargement…
    </div>
  }

  @if (!loading && projets.length === 0) {
    <div class="alert alert-info">
      Aucun projet trouvé
    </div>
  }

  @if (!loading && projets.length > 0) {
    <div class="projets-grid">
      @for (projet of projets; track projet.id) {
        <div class="projet-card">
          <h3>{{ projet.nom }}</h3>
          <p>{{ projet.description }}</p>
          <p class="dates">
            <small>
              Du {{ projet.date_debut | date:'shortDate' }}
              au {{ projet.date_fin | date:'shortDate' }}
            </small>
          </p>

          <div class="actions">
            <a [routerLink]="['/projets', projet.id]" class="btn btn-primary">
              Détails
            </a>
            @if (!projet.deleted_at) {
              <button
                (click)="deleteProjet(projet.id)"
                class="btn btn-danger"
              >
                Supprimer
              </button>
            }
            @if (projet.deleted_at) {
              <button
                (click)="restoreProjet(projet.id)"
                class="btn btn-warning"
              >
                Restaurer
              </button>
            }
          </div>
        </div>
      }
    </div>
  }
</div>
```

#### Composant de Détail de Projet

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ProjetService } from '../services/projet.service'
import { ObjectifService } from '../services/objectif.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'app-projet-detail',
  templateUrl: './projet-detail.component.html',
  styleUrls: ['./projet-detail.component.css']
})
export class ProjetDetailComponent implements OnInit, OnDestroy {
  projet: any = null
  loading = true
  error = ''
  private destroy$ = new Subject<void>()

  constructor(
    private route: ActivatedRoute,
    private projetService: ProjetService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.loadProjet(params['id'])
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  loadProjet(id: string): void {
    this.loading = true
    this.projetService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.projet = response.data
          this.loading = false
        },
        error: (error) => {
          this.error = error.error?.error?.message || 'Erreur de chargement'
          this.loading = false
        }
      })
  }

  updateBilan(): void {
    if (!this.projet.bilan.trim()) {
      return
    }

    this.projetService.update(this.projet.id, {
      bilan: this.projet.bilan
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Bilan mis à jour avec succès')
        },
        error: (error) => {
          this.error = error.error?.error?.message || 'Erreur de mise à jour'
        }
      })
  }
}
```

**Template projet-detail.component.html :**
```html
@if (!loading) {
  <div class="detail-container">
    <h2>{{ projet.nom }}</h2>

    @if (error) {
      <div class="alert alert-danger">
        {{ error }}
      </div>
    }

    <div class="project-info">
      <p><strong>Type&#8239;:</strong> {{ projet.type }}</p>
      <p><strong>Dates&#8239;:</strong> Du {{ projet.date_debut | date:'shortDate' }} au {{ projet.date_fin | date:'shortDate' }}</p>
      <p><strong>Description&#8239;:</strong> {{ projet.description }}</p>

      <div class="animateurs">
        <h3>Animateurs</h3>
        <ul>
          @for (animateur of projet.animateurs; track animateur.id) {
            <li>
              {{ animateur.nom }} ({{ animateur.role }})
            </li>
          }
        </ul>
      </div>

      <div class="objectifs">
        <h3>Objectifs</h3>
        <ul>
          @for (objectif of projet.objectifs; track objectif.id) {
            <li>
              <strong>{{ objectif.texte }}</strong>
              <p>{{ objectif.commentaire }}</p>
            </li>
          }
        </ul>
      </div>

      <div class="bilan-section">
        <h3>Bilan</h3>
        <textarea
          [(ngModel)]="projet.bilan"
          placeholder="Entrez le bilan du projet"
          rows="5"
        ></textarea>
        <button (click)="updateBilan()" class="btn btn-primary">
          Sauvegarder le bilan
        </button>
      </div>
    </div>
  </div>
}
```

### 5.7. Guards et Intercepteurs Angular

#### Guard d'Authentification

```typescript
import { Injectable } from '@angular/core'
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { Observable } from 'rxjs'
import { map, take, tap } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => !!user),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          })
        }
      })
    )
  }
}
```

#### Intercepteur de Gestion d'Erreurs

```typescript
import { Injectable } from '@angular/core'
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AuthService } from '../services/auth.service'
import { Router } from '@angular/router'

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Non authentifié
          this.authService.logout().subscribe()
          this.router.navigate(['/login'])
        } else if (error.status === 403) {
          // Accès interdit
          this.router.navigate(['/forbidden'])
        } else if (error.status === 404) {
          // Non trouvé
          console.error('Ressource non trouvée')
        } else if (error.status >= 500) {
          // Erreur serveur
          console.error('Erreur serveur')
        }

        return throwError(() => error)
      })
    )
  }
}
```

#### Configuration du Module (Angular < 14)

```typescript
import { NgModule } from '@angular/core'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { ErrorInterceptor } from './interceptors/error.interceptor'
import { AuthGuard } from './guards/auth.guard'

@NgModule({
  imports: [HttpClientModule],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
```

#### Configuration de l'Application (Angular 14+)

```typescript
import { ApplicationConfig } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { HTTP_INTERCEPTORS } from '@angular/common/http'
import { ErrorInterceptor } from './interceptors/error.interceptor'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      // ...withInterceptors() pour intercepteurs fonctionnels
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
}
```

#### Configuration du Routage avec Guards

```typescript
import { Routes } from '@angular/router'
import { LoginComponent } from './pages/login/login.component'
import { ProjetsListComponent } from './pages/projets-list/projets-list.component'
import { ProjetDetailComponent } from './pages/projet-detail/projet-detail.component'
import { AuthGuard } from './guards/auth.guard'

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'projets',
    component: ProjetsListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'projets/:id',
    component: ProjetDetailComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/projets',
    pathMatch: 'full'
  }
]
```

### 5.8. Syntaxe Moderne Angular (@if, @for, @switch)

**À partir d'Angular 17**, il est recommandé d'utiliser la nouvelle syntaxe de contrôle de flux :

#### @if au lieu de *ngIf

**Ancienne syntaxe (Angular < 17) :**
```html
<div *ngIf="isLoading">Chargement…</div>
<div *ngIf="error; else noError">Erreur</div>
<ng-template #noError>Pas d'erreur</ng-template>
```

**Nouvelle syntaxe (Angular 17+) :**
```html
@if (isLoading) {
  <div>Chargement…</div>
}

@if (error) {
  <div>Erreur</div>
} @else {
  <div>Pas d'erreur</div>
}
```

#### @for au lieu de *ngFor

**Ancienne syntaxe :**
```html
<div *ngFor="let item of items; trackBy: trackByFn">
  {{ item.name }}
</div>
```

**Nouvelle syntaxe :**
```html
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

**Points clés de @for :**
- `track` est **obligatoire** et améliore la performance
- Utiliser une propriété unique comme `track item.id`
- Meilleure optimisation qu'avec `trackBy` traditionnel

#### @switch au lieu de *ngSwitch

**Ancienne syntaxe :**
```html
<div [ngSwitch]="role">
  <div *ngSwitchCase="'admin'">Admin</div>
  <div *ngSwitchCase="'user'">Utilisateur</div>
  <div *ngSwitchDefault>Invité</div>
</div>
```

**Nouvelle syntaxe :**
```html
@switch (role) {
  @case ('admin') {
    <div>Admin</div>
  }
  @case ('user') {
    <div>Utilisateur</div>
  }
  @default {
    <div>Invité</div>
  }
}
```

#### Avantages de la Nouvelle Syntaxe

✅ **Meilleure lisibilité** - Ressemble à du code TypeScript  
✅ **Meilleure performance** - Compilation optimisée  
✅ **Type-safe** - Meilleur support du typage  
✅ **Pas de directives** - Moins de dépendances  
✅ **Track obligatoire** - Force les bonnes pratiques  

**Note :** Les exemples Angular dans ce guide utilisent cette nouvelle syntaxe recommandée (Angular 17+).

---

## 6. Exemples de Flux Métier Complets

### 6.1. Créer un Projet Complet avec Objectifs et Activités

```javascript
async function createCompleteProject() {
  try {
    // 1. Créer le projet
    const project = await projectService.create({
      nom: "Camp d'été 2025",
      type: "camp",
      date_debut: "2025-07-15",
      date_fin: "2025-07-29",
      description: "Camp à la montagne",
      role: "directeur"
    })

    // 2. Créer les objectifs
    const objectif1 = await objectifService.create(project.id, {
      texte: "Développer l'autonomie",
      commentaire: "Important"
    })

    const objectif2 = await objectifService.create(project.id, {
      texte: "Favoriser l'esprit d'équipe"
    })

    // 3. Créer les activités liées aux objectifs
    const activite = await activiteService.create(project.id, {
      titre: "Randonnée en montagne",
      description: "Randonnée de 10km",
      date_heure_debut: "2025-07-16T09:00:00Z",
      date_heure_fin: "2025-07-16T17:00:00Z",
      objectif_ids: [objectif1.id, objectif2.id]
    })

    // 4. Ajouter des collaborateurs
    const animateurs = await animateurService.listActive()
    for (const animateur of animateurs) {
      if (animateur.id !== project.created_by) {
        await projectService.addAnimateur(project.id, {
          animateur_id: animateur.id,
          role: "animateur"
        })
      }
    }

    return { project, objectifs: [objectif1, objectif2], activites: [activite] }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    throw error
  }
}
```

### 6.2. Bilan de Projet après Camp

```javascript
async function finishProjectWithReports(projectId, reports) {
  try {
    // 1. Mettre à jour le bilan du projet
    const updatedProject = await projectService.update(projectId, {
      bilan: reports.projectBilan
    })

    // 2. Mettre à jour les bilans des objectifs
    for (const [objectifId, bilan] of Object.entries(reports.objectifs)) {
      await objectifService.update(projectId, objectifId, {
        bilan: bilan
      })
    }

    // 3. Mettre à jour les bilans des activités
    for (const [activiteId, bilan] of Object.entries(reports.activites)) {
      await activiteService.update(projectId, activiteId, {
        bilan: bilan
      })
    }

    return updatedProject
  } catch (error) {
    console.error('Erreur lors de la finalisation:', error)
    throw error
  }
}
```

---

## 7. Variables d'Environnement Côté Client

```env
# URL de l'API
REACT_APP_API_URL=http://localhost:3000/api

# Ou pour production
REACT_APP_API_URL=https://api.projet-pedagogique.com

# Timeout des requêtes (ms)
REACT_APP_API_TIMEOUT=30000

# Activer les logs de débogage
REACT_APP_DEBUG=false
```

---

## 8. Tests d'Intégration Client

### 8.1. Configuration Jest + Supertest

```javascript
// tests/api.integration.test.js
const request = require('supertest')
const app = require('../src/server')

describe('API Integration Tests', () => {
  let cookieJar = {}

  beforeAll(async () => {
    // Initialiser la base de données
    await db.sync()
  })

  test('Complete workflow: register, create project, add animator', async () => {
    // 1. S'enregistrer
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        nom: 'Test User',
        password: 'SecurePassword123!@#'
      })

    expect(registerRes.status).toBe(201)
    const cookies = registerRes.headers['set-cookie']
    cookieJar.connect_sid = cookies[0]

    // 2. Créer un projet
    const projectRes = await request(app)
      .post('/api/projets')
      .set('Cookie', `connect.sid=${cookieJar.connect_sid}`)
      .send({
        nom: 'Test Project',
        type: 'camp',
        date_debut: '2025-07-15',
        date_fin: '2025-07-29',
        role: 'directeur'
      })

    expect(projectRes.status).toBe(201)
    expect(projectRes.body.data.nom).toBe('Test Project')
  })
})
```

---

## 9. Checklist pour Développeur

### 9.1. Avant de Commencer

- [ ] API démarrée et accessible sur `http://localhost:3000/api`
- [ ] Base de données MariaDB configurée et initialisée
- [ ] Variables d'environnement configurées
- [ ] Client HTTP choisi (fetch, axios, etc.)

### 9.2. Endpoints Critiques à Tester d'Abord

1. [ ] `GET /api/status` - Vérifier l'API
2. [ ] `POST /api/auth/register` - Inscription
3. [ ] `POST /api/auth/login` - Connexion
4. [ ] `GET /api/auth/me` - Récupérer l'utilisateur courant
5. [ ] `POST /api/projets` - Créer un projet
6. [ ] `GET /api/projets` - Lister les projets

### 9.3. Points d'Attention

- [ ] **Cookies** : Utiliser `withCredentials: true` avec fetch/axios
- [ ] **CORS** : Si client sur domaine différent, vérifier configuration
- [ ] **Sessions** : Durée de vie, gestion de l'expiration
- [ ] **Validation** : Vérifier les règles métier (dates, permissions)
- [ ] **Soft Delete** : Les éléments supprimés ne s'affichent pas par défaut

### 9.4. Checklist Angular Spécifique

- [ ] **HttpClient** : Importer et configurer correctement
- [ ] **withCredentials** : Activer pour envoyer les cookies
- [ ] **Intercepteurs** : Configurer ErrorInterceptor
- [ ] **Guards** : Protéger les routes avec AuthGuard
- [ ] **RxJS** : Utiliser takeUntil() pour éviter les fuites mémoire
- [ ] **Formulaires** : Utiliser ReactiveFormsModule ou FormsModule selon le besoin
- [ ] **Observables** : Gérer les souscriptions et unsubscribe
- [ ] **Services** : Un service par entité (Auth, Projet, Objectif, Activité)
- [ ] **Composants** : Séparer logique métier (service) et présentation (composant)
- [ ] **Environnements** : Configurer différentes URLs selon dev/prod
- [ ] **CORS** : Si domaine différent, vérifier configuration API
- [ ] **Zones d'authentification** : Rediriger vers login sur 401
- [ ] **Syntaxe Moderne (Angular 17+)** : Utiliser @if, @for, @switch au lieu de *ngIf, *ngFor, *ngSwitch

---

## 9. Guide Angular Complet

### 9.1. Structure Recommandée du Projet

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── error.interceptor.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── projet.service.ts
│   │       └── objectif.service.ts
│   ├── shared/
│   │   ├── components/
│   │   │   └── loading.component.ts
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── login.component.html
│   │   │   └── register/
│   │   ├── projets/
│   │   │   ├── projets-list/
│   │   │   ├── projet-detail/
│   │   │   └── projet-create/
│   │   └── objectifs/
│   └── app.routes.ts
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── main.ts
```

### 9.2. Configuration des Environnements

**environments/environment.ts :**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
}
```

**environments/environment.prod.ts :**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.projet-pedagogique.com'
}
```

**Dans les services :**
```typescript
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`
  // …
}
```

### 9.3. Meilleure Gestion des Souscriptions

**Avec takeUntil (recommandé) :**
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  selector: 'app-exemple',
  template: `…`
})
export class ExempleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  constructor(private service: MonService) {}

  ngOnInit(): void {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Traiter les données
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
```

**Alternative avec async pipe (dans le template) :**
```typescript
@Component({
  template: `
    <div *ngIf="data$ | async as data">
      {{ data.nom }}
    </div>
  `
})
export class ExempleComponent implements OnInit {
  data$ : Observable<Data>

  constructor(private service: MonService) {}

  ngOnInit(): void {
    this.data$ = this.service.getData()
  }
}
```

### 9.4. Gestion de l'État avec BehaviorSubject

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject$ = new BehaviorSubject<Animateur | null>(null)
  public currentUser$ = this.currentUserSubject$.asObservable()

  getCurrentUserValue(): Animateur | null {
    return this.currentUserSubject$.value
  }

  setCurrentUser(user: Animateur | null): void {
    this.currentUserSubject$.next(user)
  }
}

// Utilisation dans un composant
export class HeaderComponent implements OnInit {
  currentUser$: Observable<Animateur | null>

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$
  }

  logout(): void {
    this.authService.logout().subscribe()
  }
}
```

### 9.5. Gestion des Erreurs Globales

```typescript
import { ErrorHandler, Injectable, Injector } from '@angular/core'

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: Error | any): void {
    const authService = this.injector.get(AuthService)

    if (error.status === 401) {
      authService.logout().subscribe()
      console.error('Session expirée')
    } else if (error.status === 403) {
      console.error('Accès non autorisé')
    } else {
      console.error('Erreur non gérée:', error)
    }
  }
}

// Configuration dans app.config.ts ou app.module.ts
providers: [
  {
    provide: ErrorHandler,
    useClass: GlobalErrorHandler
  }
]
```

### 9.6. Exemple d'Application Complète

**app.component.ts :**
```typescript
import { Component, OnInit } from '@angular/core'
import { AuthService } from './core/services/auth.service'

@Component({
  selector: 'app-root',
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    this.authService.getCurrentUser().subscribe({
      error: () => console.log('Utilisateur non authentifié')
    })
  }
}
```

**app.routes.ts :**
```typescript
import { Routes } from '@angular/router'
import { LoginComponent } from './features/auth/login/login.component'
import { ProjetsListComponent } from './features/projets/projets-list/projets-list.component'
import { ProjetDetailComponent } from './features/projets/projet-detail/projet-detail.component'
import { AuthGuard } from './core/guards/auth.guard'

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'projets',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ProjetsListComponent
      },
      {
        path: ':id',
        component: ProjetDetailComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/projets'
  }
]
```

---

## 10. Support et Ressources

### 10.1. Documentation Officielle

- [Express.js](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)
- [MariaDB Documentation](https://mariadb.com/docs/)
- [Axios](https://axios-http.com/)
- [Angular Documentation](https://angular.io/docs)
- [Angular HttpClient](https://angular.io/guide/http)
- [Angular Forms](https://angular.io/guide/forms)
- [Angular Services](https://angular.io/guide/architecture-services)

### 10.2. Debugging

**Activer les logs SQL :**
```javascript
const sequelize = new Sequelize({
  // …
  logging: console.log
})
```

**Inspecter les cookies dans le navigateur :**
```javascript
console.log(document.cookie)
```

**Vérifier la session en Node.js :**
```javascript
console.log(req.session)
```

### 10.3. Contactez l'Équipe

Pour toute question sur l'API, consultez :
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Configuration de la BD
- [api-pedagogique-specs.md](./api-pedagogique-specs.md) - Spécifications complètes
- [plan_developpement.md](./plan_developpement.md) - Roadmap du développement

---

**Document généré le** : 11 février 2026  
**Version** : 1.0  
**Auteur** : Olivier Gendrin







