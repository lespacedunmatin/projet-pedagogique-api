import request from 'supertest';
import app from '../src/server';
import Animateur from '../src/models/Animateur';
import Projet from '../src/models/Projet';
import AnimateurProjet from '../src/models/AnimateurProjet';
import bcrypt from 'bcrypt';
import {UUID} from "node:crypto";
import { getAuthenticatedSession } from './helpers';

describe('POST /animateurs', () => {
  let trashBin: null | UUID;

  beforeEach(async () => {
    trashBin = null;
  });

  afterEach(async () => {
    if (!trashBin) {
      return;
    }

    await Animateur.destroy({ where: { id: trashBin }, force: true });
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
    expect(response.body.animateur.password).toBeUndefined();
    expect(response.body.animateur.id).toBeDefined();

    const animateur = await Animateur.findByPk(response.body.animateur.id);
    expect(animateur).toBeDefined();
    expect(animateur!.password).not.toBe(animateurData.password);
    const isPasswordMatch = await bcrypt.compare(animateurData.password, animateur!.password);
    expect(isPasswordMatch).toBe(true);
  });

  it('devrait retourner une erreur 400 si des champs obligatoires sont manquants', async () => {
    const response = await request(app)
      .post('/animateurs')
      .send({
        email: 'test@example.com',
        nom: 'Jean Dupont',
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('devrait retourner une erreur 409 si l\'email existe déjà', async () => {
    const animateurData = {
      email: 'test123@example.com',
      password: 'password123',
      nom: 'Jean Dupont',
    };

    const firstResponse = await request(app)
      .post('/animateurs')
      .send(animateurData)
      .expect(201);

    trashBin = firstResponse.body.animateur.id;

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
  let sessionCookie: string;

  beforeAll(async () => {
    await Animateur.destroy({ where: {}, force: true });
  })

  beforeEach(async () => {
    createdAnimateursUUID = [];
    const alice = {
      email: 'alice@example.com',
      password: 'password123',
      nom: 'Alice Martin',
      bio: 'Animatrice expérimentée',
    }

    const animateurs = [
      {
        email: alice.email,
        password: await bcrypt.hash(alice.password, 10),
        nom: alice.nom,
        bio: alice.bio,
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

    sessionCookie = await getAuthenticatedSession(createdAnimateursUUID[0], alice.password);
  });

  afterEach(async () => {
    for (const id of createdAnimateursUUID) {
      await Animateur.destroy({ where: { id } });
    }
    createdAnimateursUUID = [];
  });

  it('devrait retourner la liste de tous les animateurs sans le paramètre id_projet', async () => {
    const response = await request(app)
      .get('/animateurs')
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(3);

    const emails = response.body.animateurs.map((a: any) => a.email);
    expect(emails).toContain('alice@example.com');
    expect(emails).toContain('bob@example.com');
    expect(emails).toContain('charlie@example.com');

    response.body.animateurs.forEach((animateur: any) => {
      expect(animateur.password).toBeUndefined();
    });
  });
});

describe('GET /animateurs/:id', () => {
  let createdAnimateursUUID: UUID[] = [];
  let sessionCookie: string;
  let animateurId: string;
  let projetIds: string[] = [];

  beforeAll(async () => {
    await Animateur.destroy({ where: {}, force: true });
  });

  beforeEach(async () => {
    createdAnimateursUUID = [];
    const alice = {
      email: 'alice@example.com',
      password: 'password123',
      nom: 'Alice Martin',
      bio: 'Animatrice expérimentée',
    }
    const animateurs = [
      {
        email: alice.email,
        password: await bcrypt.hash(alice.password, 10),
        nom: alice.nom,
        bio: alice.bio,
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

    animateurId = createdAnimateursUUID[0];
    sessionCookie = await getAuthenticatedSession(animateurId, alice.password);

    const projets = [
      { nom: 'Projet Été 2026', description: 'Activités estivales' },
      { nom: 'Projet Noël 2026', description: 'Animations festives' },
      { nom: 'Projet Pâques 2026', description: 'Activités printanières' },
    ];

    for (const projetData of projets) {
      const projet = await Projet.create(projetData);
      projetIds.push(projet.id);

      await AnimateurProjet.create({
        animateur_id: animateurId,
        projet_id: projet.id,
        role: 'coordinateur',
      });
    }
  });

  afterEach(async () => {
    await AnimateurProjet.destroy({ where: { animateur_id: animateurId }, force: true });
    await Projet.destroy({ where: { id: projetIds }, force: true });
    for (const id of createdAnimateursUUID) {
      await Animateur.destroy({ where: { id } });
    }
    createdAnimateursUUID = [];
    projetIds = [];
  });

  it('devrait retourner un animateur avec ses projets associés si with=projets', async () => {
    const response = await request(app)
      .get(`/animateurs/${animateurId}?with=projets`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateur).toBeDefined();
    expect(response.body.animateur.id).toBe(animateurId);
    expect(response.body.projets).toBeDefined();
    expect(response.body.projets).toBeInstanceOf(Array);
    expect(response.body.projets.length).toBe(3);

    const noms = response.body.projets.map((p: any) => p.projet.nom);
    expect(noms).toContain('Projet Été 2026');
    expect(noms).toContain('Projet Noël 2026');
    expect(noms).toContain('Projet Pâques 2026');

    response.body.projets.forEach((p: any) => {
      expect(p.role).toBe('coordinateur');
      expect(p.liaison_id).toBeDefined();
      expect(p.created_at).toBeDefined();
    });
  });

  it('devrait retourner un tableau vide de projets si l\'animateur n\'en a aucun', async () => {
    const animateurSansProjets = await Animateur.create({
      email: 'sans-projets@example.com',
      password: await bcrypt.hash('password123', 10),
      nom: 'Animateur sans Projets',
    });

    const response = await request(app)
      .get(`/animateurs/${animateurSansProjets.id}?with=projets`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateur).toBeDefined();
    expect(response.body.projets).toEqual([]);

    await Animateur.destroy({ where: { id: animateurSansProjets.id }, force: true });
  });

  it('devrait exclure les projets supprimés (soft delete)', async () => {
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetIds[0] } }
    );

    const response = await request(app)
      .get(`/animateurs/${animateurId}?with=projets`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projets.length).toBe(2);

    const noms = response.body.projets.map((p: any) => p.projet.nom);
    expect(noms).not.toContain('Projet Été 2026');
  });

  it('devrait exclure les liaisons supprimées (soft delete)', async () => {
    await AnimateurProjet.update(
      { deleted_at: new Date() },
      { where: { animateur_id: animateurId, projet_id: projetIds[0] } }
    );

    const response = await request(app)
      .get(`/animateurs/${animateurId}?with=projets`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projets.length).toBe(2);

    const noms = response.body.projets.map((p: any) => p.projet.nom);
    expect(noms).not.toContain('Projet Été 2026');
  });

  it('devrait retourner seulement l\'animateur sans projets si with n\'est pas "projets"', async () => {
    const response = await request(app)
      .get(`/animateurs/${animateurId}?with=autre`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateur).toBeDefined();
    expect(response.body.projets).toBeUndefined();
  });

  it('devrait retourner seulement l\'animateur sans projets si with n\'est pas fourni', async () => {
    const response = await request(app)
      .get(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateur).toBeDefined();
    expect(response.body.projets).toBeUndefined();
  });
});

describe('DELETE /animateurs/:id', () => {
  let animateurId: string;
  let sessionAnimateurId: string;
  let sessionCookie: string;

  beforeAll(async () => {
    await Animateur.destroy({ where: {}, force: true });
  });

  beforeEach(async () => {
    const sessionAnimateurData = {
      email: 'session-test@example.com',
      password: 'Brownse@-1907',
      nom: 'Session Animateur'
    }
    const animateur = await Animateur.create({
      email: 'delete-test@example.com',
      password: await bcrypt.hash('password123', 10),
      nom: 'À Supprimer',
      bio: 'Sera supprimé',
    });
    const sessionAnimateur = await Animateur.create({
      ...sessionAnimateurData,
      password: await bcrypt.hash(sessionAnimateurData.password, 10)
    });

    animateurId = animateur.id;
    sessionAnimateurId = sessionAnimateur.id;
    sessionCookie = await getAuthenticatedSession(sessionAnimateurId, sessionAnimateurData.password);
  });

  afterEach(async () => {
    await Animateur.destroy({ where: { id: animateurId }, force: true });
    await Animateur.destroy({ where: { id: sessionAnimateurId }, force: true });
  });

  it('devrait effectuer un soft delete en renseignant deleted_at', async () => {
    const response = await request(app)
      .delete(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.message).toBe('Animateur supprimé avec succès');
    expect(response.body.animateur.id).toBe(animateurId);
    expect(response.body.animateur.deleted_at).toBeDefined();
    expect(response.body.animateur.deleted_at).not.toBeNull();

    const deletedAnimateur = await Animateur.findByPk(animateurId);
    expect(deletedAnimateur).toBeDefined();
    expect(deletedAnimateur!.deleted_at).not.toBeNull();
  });

  it('devrait retourner une erreur 404 si l\'animateur n\'existe pas', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440999';
    const response = await request(app)
      .delete(`/animateurs/${fakeId}`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner une erreur 410 si l\'animateur est déjà supprimé', async () => {
    await request(app)
      .delete(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    const response = await request(app)
      .delete(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(410);

    expect(response.body.error).toBe('Cet animateur a déjà été supprimé');
  });

  it('devrait exclure l\'animateur supprimé de la liste GET', async () => {
    await request(app)
      .delete(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    const listResponse = await request(app)
      .get('/animateurs')
      .set('cookie', sessionCookie)
      .expect(200);

    const emails = listResponse.body.animateurs.map((a: any) => a.email);
    expect(emails).not.toContain('delete-test@example.com');
  });

  it('devrait exclure l\'animateur supprimé de GET /animateurs/:id', async () => {
    await request(app)
      .delete(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    const getResponse = await request(app)
      .get(`/animateurs/${animateurId}`)
      .set('cookie', sessionCookie)
      .expect(410);

    expect(getResponse.body.error).toBe('Animateur supprimé');
  });
});
