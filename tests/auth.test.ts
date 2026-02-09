import request from 'supertest';
import app from '../src/server';
import Animateur from '../src/models/Animateur';
import bcrypt from "bcrypt";

describe('POST /auth/register', () => {
  afterEach(async () => {
    // Nettoyer les données créées
    await Animateur.destroy({ where: {} });
  });

  it('devrait créer un nouvel animateur avec succès', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('Inscription réussie');
    expect(response.body.animateur).toBeDefined();
    expect(response.body.animateur.id).toBeDefined();
    expect(response.body.animateur.email).toBe(userData.email);
    expect(response.body.animateur.nom).toBe(userData.nom);
    expect(response.body.animateur.password).toBeUndefined(); // Pas de mot de passe en réponse

    // Vérifier que la session est établie
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('devrait retourner 400 si l\'email est manquant', async () => {
    const userData = {
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('L\'email est obligatoire');
  });

  it('devrait retourner 400 si le mot de passe est manquant', async () => {
    const userData = {
      email: 'newuser@example.com',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Le mot de passe est obligatoire');
  });

  it('devrait retourner 400 si la confirmation du mot de passe est manquante', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('La confirmation du mot de passe est obligatoire');
  });

  it('devrait retourner 400 si le nom est manquant', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Le nom est obligatoire');
  });

  it('devrait retourner 400 si l\'email est invalide', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Format d\'email invalide');
  });

  it('devrait retourner 400 si le mot de passe est trop court', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'Short1!',
      confirmPassword: 'Short1!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Le mot de passe doit contenir au moins 12 caractères');
  });

  it('devrait retourner 400 si les mots de passe ne correspondent pas', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Les mots de passe ne correspondent pas');
  });

  it('devrait retourner 400 si le mot de passe ne respecte pas les critères de sécurité', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'weakpassword123', // Pas de majuscule, pas de caractère spécial
      confirmPassword: 'weakpassword123',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.error).toBe('Le mot de passe ne respecte pas les critères de sécurité');
    expect(response.body.requirements).toBeDefined();
    expect(response.body.requirements.hasUppercase).toBe(false);
    expect(response.body.requirements.hasSpecialChar).toBe(false);
  });

  it('devrait retourner 409 si l\'email existe déjà', async () => {
    const userData = {
      email: 'existing@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    // Créer le premier utilisateur
    await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Essayer de créer un deuxième utilisateur avec le même email
    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(409);

    expect(response.body.error).toBe('Cet email est déjà utilisé');
  });

  it('devrait accepter les emails en majuscules et les convertir en minuscules', async () => {
    const userData = {
      email: 'NewUser@Example.COM',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.animateur.email).toBe('newuser@example.com');

    // Vérifier que l'email est sauvegardé en minuscules en base
    const animateur = await Animateur.findByPk(response.body.animateur.id);
    expect(animateur?.email).toBe('newuser@example.com');
  });

  it('devrait accepter les noms avec des espaces et les trimmer', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: '  Nouvel Utilisateur  ',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.animateur.nom).toBe('Nouvel Utilisateur');
  });

  it('ne devrait pas retourner le mot de passe en réponse', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.animateur.password).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('SecurePass123!');
  });

  it('devrait retourner 400 si l\'utilisateur est déjà authentifié', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      nom: 'Nouvel Utilisateur',
    };

    // Créer et authentifier le premier utilisateur
    const firstResponse = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Essayer de s'inscrire à nouveau avec la même session
    const secondUserData = {
      email: 'anotheruser@example.com',
      password: 'SecurePass456!',
      confirmPassword: 'SecurePass456!',
      nom: 'Autre Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .set('cookie', firstResponse.headers['set-cookie'][0])
      .send(secondUserData)
      .expect(400);

    expect(response.body.error).toBe('Vous êtes déjà connecté');
  });

  it('devrait valider un mot de passe fort avec tous les critères', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'MyStr0ngP@ssw0rd!',
      confirmPassword: 'MyStr0ngP@ssw0rd!',
      nom: 'Nouvel Utilisateur',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('Inscription réussie');
    expect(response.body.animateur.id).toBeDefined();
  });
});

describe('POST /auth/login', () => {
  let animateurId: string;
  const password = 'SecurePass123!';
  const email = 'login-test@example.com';

  beforeEach(async () => {
    // Créer un animateur pour les tests de login
    const hashedPassword = await bcrypt.hash(password, 10);
    const animateur = await Animateur.create({
      email,
      password: hashedPassword,
      nom: 'Test Login User',
    });
    animateurId = animateur.id;
  });

  afterEach(async () => {
    // Nettoyer les données créées
    await Animateur.destroy({ where: {} });
  });

  it('devrait connecter un utilisateur avec succès', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    expect(response.body.message).toBe('Connexion réussie');
    expect(response.body.animateur).toBeDefined();
    expect(response.body.animateur.id).toBe(animateurId);
    expect(response.body.animateur.email).toBe(email);
    expect(response.body.animateur.password).toBeUndefined();

    // Vérifier que la session est établie
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('devrait retourner 400 si l\'email est manquant', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password,
      })
      .expect(400);

    expect(response.body.error).toBe('L\'email est obligatoire');
  });

  it('devrait retourner 400 si le mot de passe est manquant', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
      })
      .expect(400);

    expect(response.body.error).toBe('Le mot de passe est obligatoire');
  });

  it('devrait retourner 401 si l\'email n\'existe pas', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password,
      })
      .expect(401);

    expect(response.body.error).toBe('Email ou mot de passe incorrect');
  });

  it('devrait retourner 401 si le mot de passe est incorrect', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body.error).toBe('Email ou mot de passe incorrect');
  });

  it('devrait retourner 401 si l\'utilisateur est supprimé', async () => {
    // Supprimer l'utilisateur
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateurId } });

    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(401);

    expect(response.body.error).toBe('Email ou mot de passe incorrect');
  });

  it('devrait accepter les emails en majuscules et les normaliser', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: email.toUpperCase(),
        password,
      })
      .expect(200);

    expect(response.body.message).toBe('Connexion réussie');
    expect(response.body.animateur.id).toBe(animateurId);
  });

  it('devrait retourner 400 si l\'utilisateur est déjà authentifié', async () => {
    // Créer une première session
    const firstResponse = await request(app)
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    // Essayer de se connecter à nouveau avec la même session
    const secondResponse = await request(app)
      .post('/auth/login')
      .set('cookie', firstResponse.headers['set-cookie'][0])
      .send({
        email,
        password,
      })
      .expect(400);

    expect(secondResponse.body.error).toBe('Vous êtes déjà connecté');
  });

  it('ne devrait pas retourner le mot de passe en réponse', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    expect(response.body.animateur.password).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('SecurePass');
  });
});

