# Configuration de CORS et Sécurité

## 🔒 CORS (Cross-Origin Resource Sharing)

### Qu'est-ce que CORS ?

CORS est un mécanisme de sécurité qui contrôle les accès entre différents domaines.

**Exemple :**
- API : `http://localhost:3000` 
- Client Angular : `http://localhost:4200`

Sans CORS, le navigateur bloquerait l'accès du client à l'API.

### Configuration Actuelle

L'API est configurée pour accepter les requêtes provenant de domaines spécifiés dans la variable `CORS_ORIGIN`.

#### Fichier `src/server.ts`

```typescript
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:4200'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,  // Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24h
}));
```

### Configuration par Environnement

#### Développement Local (`.env`)

```env
CORS_ORIGIN=http://localhost:3000,http://localhost:4200,http://localhost:3001
```

Accepte les requêtes de :
- `http://localhost:3000` - L'API elle-même
- `http://localhost:4200` - Client Angular standard
- `http://localhost:3001` - Client React standard

#### Production (`.env.production`)

```env
# Un seul domaine
CORS_ORIGIN=https://app.projet-pedagogique.com

# Ou plusieurs domaines
CORS_ORIGIN=https://app.projet-pedagogique.com,https://admin.projet-pedagogique.com
```

### Points de Sécurité Importants

#### 1. Ne Jamais Utiliser `*` en Production

❌ **DANGEREUX :**
```typescript
app.use(cors({
  origin: '*',  // ⚠️ DANGER : Tout domaine peut accéder
  credentials: true
}));
```

✅ **SÉCURISÉ :**
```typescript
app.use(cors({
  origin: ['https://app.exemple.com', 'https://admin.exemple.com'],
  credentials: true
}));
```

#### 2. Utiliser HTTPS en Production

✅ **Développement :**
```
http://localhost:3000
```

✅ **Production :**
```
https://api.exemple.com
```

#### 3. Inclure Protocol et Port

✅ **Correct :**
```env
CORS_ORIGIN=https://exemple.com:443,https://app.exemple.com:8443
```

❌ **Incorrect :**
```env
CORS_ORIGIN=exemple.com,app.exemple.com
```

#### 4. Gestion des Cookies

La configuration inclut `credentials: true` pour autoriser les cookies HttpOnly :

```typescript
app.use(cors({
  credentials: true,  // ✅ Autorise les cookies
  // ...
}));
```

**En client, assurez-vous d'envoyer les cookies :**

```javascript
// Fetch
fetch('http://localhost:3000/api/projets', {
  credentials: 'include'  // ✅ Important
})

// Axios
axios.defaults.withCredentials = true

// Angular HttpClient
// Configuré automatiquement si CORS est correct
```

### Méthodes et Headers Autorisés

#### Méthodes HTTP

```typescript
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
```

Toutes les opérations CRUD sont autorisées.

#### Headers

```typescript
allowedHeaders: ['Content-Type', 'Authorization']
```

- `Content-Type` : Pour envoyer du JSON
- `Authorization` : Pour les tokens (futures implémentations)

### Cache CORS (maxAge)

```typescript
maxAge: 86400  // 24 heures en secondes
```

Le navigateur met en cache les réponses de pré-vol CORS (OPTIONS) pendant 24h.

En développement, réduisez cette valeur :

```typescript
maxAge: 3600  // 1 heure
```

### Dépannage CORS

#### Erreur : "Access to XMLHttpRequest blocked by CORS policy"

**Vérifications :**

1. **Origines :**
   ```bash
   # Vérifier que votre domaine est dans CORS_ORIGIN
   echo $CORS_ORIGIN
   ```

2. **Redémarrer l'API :**
   ```bash
   npm run dev
   ```

3. **Vérifier la console navigateur :**
   - Ouvrir DevTools (F12)
   - Aller à l'onglet Network
   - Chercher la requête qui échoue
   - Vérifier les headers CORS

4. **Exemple complet de dépannage :**

   ```bash
   # Terminal API
   echo "CORS_ORIGIN actuel :"
   grep CORS_ORIGIN .env
   
   # Redémarrer
   npm run dev
   ```

   ```javascript
   // Console navigateur
   fetch('http://localhost:3000/api/projets', {
     credentials: 'include'
   })
   .then(r => {
     console.log('Status:', r.status)
     console.log('Headers:', r.headers)
     return r.json()
   })
   .then(data => console.log('Data:', data))
   .catch(error => console.error('Erreur:', error))
   ```

#### Erreur : "The CORS protocol does not allow specifying a wildcard (*) character"

Cela signifie que vous essayez d'utiliser `*` avec `credentials: true`.

✅ **Solution :**
```env
# Spécifier les domaines exactes
CORS_ORIGIN=https://app.exemple.com,https://admin.exemple.com
```

### Configuration Docker

Si vous utilisez Docker, assurez-vous que les domaines correspondent :

```dockerfile
# Dockerfile ou docker-compose.yml
ENV CORS_ORIGIN=http://localhost:3000,http://localhost:4200
```

### Configuration Nginx (Proxy Reverse)

Si vous utilisez Nginx, il peut ajouter ses propres headers CORS :

```nginx
# nginx.conf
server {
    location /api/ {
        proxy_pass http://localhost:3000;
        
        # Ne pas ajouter d'autres headers CORS ici
        # Laisser l'API Express les gérer
    }
}
```

---

## Sécurité Supplémentaire

### Helmet.js

L'API utilise Helmet.js pour configurer les headers HTTP de sécurité :

```typescript
app.use(helmet());
```

**Headers configurés :**
- `Content-Security-Policy` : Prévient les injections XSS
- `X-Frame-Options` : Prévient le clickjacking
- `X-Content-Type-Options` : Prévient le sniffing MIME
- `Strict-Transport-Security` : Force HTTPS en production

### Sessions Sécurisées

Les cookies de session sont configurés avec :
- `HttpOnly` : Non accessible depuis JavaScript
- `SameSite` : Protection contre les attaques CSRF
- `Secure` : Transmis uniquement en HTTPS (production)

### Validation des Données

Toutes les entrées sont validées via Sequelize et les middlewares.

---

## Checklist Déploiement Production

- [ ] CORS_ORIGIN configuré avec les domaines de production
- [ ] Tous les domaines utilisent HTTPS
- [ ] NODE_ENV = production
- [ ] SESSION_SECRET = clé cryptographiquement sécurisée
- [ ] Database credentials sécurisés et différents du dev
- [ ] Pas de logs verbeux en production
- [ ] Rate limiting configuré (si nécessaire)
- [ ] Backups automatiques activés

---

## Ressources

- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS](https://github.com/expressjs/cors)
- [Helmet.js](https://helmetjs.github.io/)
- [OWASP - CORS Misconfiguration](https://owasp.org/www-community/attacks/CORS_Misconfiguration)

