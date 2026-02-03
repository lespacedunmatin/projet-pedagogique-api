import request from 'supertest';
import app from '../src/server';
import Animateur from '../src/models/Animateur';
import bcrypt from 'bcrypt';
import {UUID} from "node:crypto";

describe('POST /animateurs', () => {
  let trashBin: null | UUID;

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
    await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(201);

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
