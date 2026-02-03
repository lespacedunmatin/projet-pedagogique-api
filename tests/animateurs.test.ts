import request from 'supertest';
import app from '../src/server';
import Animateur from '../src/models/Animateur';
import bcrypt from 'bcrypt';
import {UUID} from "node:crypto";

describe('POST /animateurs', () => {
  let trashBin: null | UUID;

  beforeAll(async () => {
    // S'assurer que la table Animateurs est vide avant de commencer les tests
    await Animateur.destroy({ where: {}, truncate: true });
  });

  beforeEach(async () => {
    trashBin = null;
  })

  afterEach(async () => {
    // Nettoyer la table après chaque test qui a créé un animateur
    if (!trashBin) {
      return;
    }

    await Animateur.destroy({ where: {id: trashBin}, truncate: true });
  });

  it('devrait créer un nouvel animateur avec un mot de passe chiffré', async () => {
    const animateurData = {
      email: 'test@example.com',
      password: 'password123',
      nom: 'Jean Dupont',
      bio: 'Animateur de loisirs',
    };

    const response = await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(201);

    trashBin = response.body.animateur.id;

    expect(response.body.message).toBe('Animateur créé avec succès');
    expect(response.body.animateur).toBeDefined();
    expect(response.body.animateur.email).toBe(animateurData.email);
    expect(response.body.animateur.nom).toBe(animateurData.nom);
    expect(response.body.animateur.bio).toBe(animateurData.bio);
    expect(response.body.animateur.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
    expect(response.body.animateur.id).toBeDefined();

    // Vérifier que le mot de passe est bien chiffré en base de données
    const animateur = await Animateur.findByPk(response.body.animateur.id);
    expect(animateur).toBeDefined();
    expect(animateur!.password).not.toBe(animateurData.password); // Le mot de passe ne doit pas être en clair
    const isPasswordMatch = await bcrypt.compare(animateurData.password, animateur!.password);
    expect(isPasswordMatch).toBe(true); // Le mot de passe déchiffré doit correspondre
  });

  it('devrait retourner une erreur 400 si des champs obligatoires sont manquants', async () => {
    const response = await request(app)
      .post('/animateurs')
      .send({
        email: 'test@example.com',
        // password manquant
        nom: 'Jean Dupont',
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('devrait retourner une erreur 409 si l\'email existe déjà', async () => {
    const animateurData = {
      email: 'test@example.com',
      password: 'password123',
      nom: 'Jean Dupont',
    };

    // Créer le premier animateur
    const firstResponse = await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(201);

    trashBin = firstResponse.body.animateur.id;

    // Essayer de créer un deuxième animateur avec le même email
    const response = await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(409);

    expect(response.body.error).toBe('Un animateur avec cet email existe déjà');
  });

  it('devrait créer un animateur sans bio si non fourni', async () => {
    const animateurData = {
      email: 'test2@example.com',
      password: 'password456',
      nom: 'André Dupont',
    };

    const response = await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(201);

    trashBin = response.body.animateur.id;

    expect(response.body.animateur.bio).toBeUndefined();
  });
});

describe('GET /animateurs', () => {
  let createdAnimateursUUID: UUID[] = [];

  beforeAll(async () => {
    // S'assurer que la table Animateurs est vide avant de commencer les tests
    await Animateur.destroy({ where: {}, truncate: true });
  });

  beforeEach(async () => {
    createdAnimateursUUID = [];
    // Créer quelques animateurs de test
    const animateurs = [
      {
        email: 'alice@example.com',
        password: await bcrypt.hash('password123', 10),
        nom: 'Alice Martin',
        bio: 'Animatrice expérimentée',
      },
      {
        email: 'bob@example.com',
        password: await bcrypt.hash('password456', 10),
        nom: 'Bob Durand',
        bio: 'Nouvel animateur',
      },
      {
        email: 'charlie@example.com',
        password: await bcrypt.hash('password789', 10),
        nom: 'Charlie Lefevre',
        bio: undefined,
      },
    ];

    for (const animateur of animateurs) {
      const created = await Animateur.create(animateur);
      createdAnimateursUUID.push(created.id as UUID);
    }
  });

  afterEach(async () => {
    // Supprimer tous les animateurs créés
    for (const id of createdAnimateursUUID) {
      await Animateur.destroy({ where: { id } });
    }
    createdAnimateursUUID = [];
  });

  it('devrait retourner la liste de tous les animateurs sans le paramètre id_projet', async () => {
    const response = await request(app)
      .get('/animateurs')
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(3);

    // Vérifier que les données attendues sont présentes
    const emails = response.body.animateurs.map((a: any) => a.email);
    expect(emails).toContain('alice@example.com');
    expect(emails).toContain('bob@example.com');
    expect(emails).toContain('charlie@example.com');

    // Vérifier que les mots de passe ne sont pas retournés
    response.body.animateurs.forEach((animateur: any) => {
      expect(animateur.password).toBeUndefined();
    });
  });

  it('devrait retourner la liste de tous les animateurs avec id_projet vide', async () => {
    const response = await request(app)
      .get('/animateurs?id_projet=')
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.animateurs.length).toBe(3);
  });

  it('devrait retourner une erreur 501 si id_projet est fourni avec une valeur valide', async () => {
    const response = await request(app)
      .get('/animateurs?id_projet=550e8400-e29b-41d4-a716-446655440000')
      .expect(501);

    expect(response.body.error).toBeDefined();
    expect(response.body.error).toBe('Le filtrage par id_projet n\'est pas encore implémenté');
  });

  it('devrait retourner un tableau vide si aucun animateur n\'existe', async () => {
    // Supprimer tous les animateurs
    await Animateur.destroy({ where: { id: createdAnimateursUUID } });
    createdAnimateursUUID = [];

    const response = await request(app)
      .get('/animateurs')
      .expect(200);

    expect(response.body.count).toBe(0);
    expect(response.body.animateurs).toEqual([]);
  });

  it('devrait retourner tous les animateurs non supprimés (soft delete)', async () => {
    // Marquer un animateur comme supprimé (soft delete)
    await Animateur.update(
      { deleted_at: new Date() },
      { where: { id: createdAnimateursUUID[0] } }
    );

    const response = await request(app)
      .get('/animateurs')
      .expect(200);

    expect(response.body.count).toBe(2);
    expect(response.body.animateurs.length).toBe(2);

    // Vérifier que l'animateur supprimé n'est pas dans la liste
    const emails = response.body.animateurs.map((a: any) => a.email);
    expect(emails).not.toContain('alice@example.com');
  });
});

