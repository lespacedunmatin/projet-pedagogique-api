# Route POST /animateurs

## Description
Cette route permet de créer un nouvel animateur en base de données avec un mot de passe chiffré avec bcrypt.

## Endpoint
```
POST /animateurs
```

## Paramètres de requête (Body JSON)

### Obligatoires
- `email` (string) : Adresse email unique de l'animateur
- `password` (string) : Mot de passe en clair (sera chiffré avec bcrypt)
- `nom` (string) : Nom complet de l'animateur

### Optionnels
- `bio` (string) : Biographie ou description de l'animateur (par exemple ses qualifications, diplômes et compétences)

## Exemple de requête

```bash
curl -X POST http://localhost:3000/animateurs \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "password": "motdepasse123",
    "nom": "Jean Dupont",
    "bio": "Animateur de loisirs avec 5 ans d'expérience, BAFA complet, permis B"
  }'
```

## Réponses

### Succès (201 Created)
```json
{
  "message": "Animateur créé avec succès",
  "animateur": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jean.dupont@example.com",
    "nom": "Jean Dupont",
    "bio": "Animateur de loisirs avec 5 ans d'expérience, BAFA complet, permis B",
    "created_at": "2026-02-03T14:54:00.000Z",
    "updated_at": "2026-02-03T14:54:00.000Z",
    "deleted_at": null
  }
}
```

### Erreur : Champs manquants (400 Bad Request)
```json
{
  "error": "Les champs email, password et nom sont obligatoires"
}
```

### Erreur : Email existe déjà (409 Conflict)
```json
{
  "error": "Un animateur avec cet email existe déjà"
}
```

### Erreur serveur (500 Internal Server Error)
```json
{
  "error": "Erreur lors de la création de l'animateur"
}
```

## Sécurité

- Le mot de passe est chiffré avec bcrypt (10 rounds) avant d'être stocké en base de données
- Le mot de passe n'est jamais retourné dans la réponse API
- L'email est validé et unique en base de données
- La validation des adresses email est effectuée via Sequelize

## Validation des données

- `email` : Format d'email valide (validé par Sequelize)
- `password` : Aucune restriction de longueur côté API (à définir si nécessaire)
- `nom` : Chaîne de caractères obligatoire
- `bio` : Texte optionnel

## Notes
- L'ID de l'animateur est généré automatiquement (UUID v4)
- Les dates `created_at` et `updated_at` sont gérées automatiquement par la base de données
