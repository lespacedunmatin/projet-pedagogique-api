import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import Objectif from '../src/models/Objectif';
import bcrypt from 'bcrypt';
import { getAuthenticatedSession } from './helpers';

describe('POST /projets/:projet_id/objectifs', () => {
  let animateurId: string;
  let projetId: string;
  let sessionCookie: string;

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: `test-objectif-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Test Animateur Objectif',
    });
    animateurId = animateur.id;

    // Créer un projet de test
    const projet = await Projet.create({
      nom: 'Projet Test Objectifs',
      description: 'Projet pour tester les objectifs',
      date_debut: new Date('2026-06-01'),
      date_fin: new Date('2026-08-31'),
    });
    projetId = projet.id;

    // Ajouter l'animateur au projet
    await AnimateurProjet.create({
      animateur_id: animateurId,
      projet_id: projetId,
      role: 'coordinateur',
    });

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateurId, 'password123');
  });

  afterEach(async () => {
    // Nettoyer les données créées
    await Objectif.destroy({ where: {} });
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateurId }, force: true });
  });

  it('devrait créer un objectif avec succès', async () => {
    const objectifData = {
      texte: 'Enseigner les bases de la programmation',
      ordre: 1,
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(201);

    expect(response.body.message).toBe('Objectif créé avec succès');
    expect(response.body.objectif).toBeDefined();
    expect(response.body.objectif.id).toBeDefined();
    expect(response.body.objectif.texte).toBe(objectifData.texte);
    expect(response.body.objectif.ordre).toBe(objectifData.ordre);
    expect(response.body.objectif.created_by).toBe(animateurId);
    expect(response.body.objectif.projet_id).toBe(projetId);
  });

  it('devrait créer un objectif avec ordre par défaut à 0', async () => {
    const objectifData = {
      texte: 'Objectif sans ordre spécifié',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(201);

    expect(response.body.objectif.ordre).toBe(0);
  });

  it('devrait retourner 400 si le texte est manquant', async () => {
    const objectifData = {
      ordre: 1,
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(400);

    expect(response.body.error).toBe('Le champ texte est obligatoire');
  });

  it('devrait retourner 400 si l\'animateur_id est manquant', async () => {
    const objectifData = {
      texte: 'Objectif sans animateur',
      ordre: 1,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(400);

    expect(response.body.error).toBe('Le champ animateur_id est obligatoire');
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const fakeProjetId = '00000000-0000-0000-0000-000000000000';
    const objectifData = {
      texte: 'Objectif pour projet inexistant',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${fakeProjetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si l\'animateur n\'existe pas', async () => {
    const fakeAnimateurId = '00000000-0000-0000-0000-000000000000';
    const objectifData = {
      texte: 'Objectif avec animateur inexistant',
      animateur_id: fakeAnimateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner 403 si l\'animateur n\'est pas membre du projet', async () => {
    // Créer un animateur qui n'est pas membre du projet
    const autreAnimateur = await Animateur.create({
      email: `autre-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Autre Animateur',
    });

    const objectifData = {
      texte: 'Objectif créé par un animateur non-membre',
      animateur_id: autreAnimateur.id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(403);

    expect(response.body.error).toBe('Cet animateur n\'est pas membre du projet');

    // Nettoyer
    await Animateur.destroy({ where: { id: autreAnimateur.id }, force: true });
  });

  it('devrait retourner 404 si l\'animateur est supprimé', async () => {
    // Supprimer l'animateur (soft delete)
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateurId } });

    const objectifData = {
      texte: 'Objectif avec animateur supprimé',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet (soft delete)
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const objectifData = {
      texte: 'Objectif pour projet supprimé',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .send(objectifData)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });
});

describe('GET /projets/:projet_id/objectifs', () => {
  let animateur1Id: string;
  let animateur2Id: string;
  let projetId: string;
  let sessionCookie: string;

  beforeEach(async () => {
    // Créer deux animateurs
    const animateur1 = await Animateur.create({
      email: `test1-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Animateur 1',
    });
    animateur1Id = animateur1.id;

    // Établir une session authentifiée pour l'animateur 1
    sessionCookie = await getAuthenticatedSession(animateur1Id, 'password123');

    const animateur2 = await Animateur.create({
      email: `test2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Animateur 2',
    });
    animateur2Id = animateur2.id;

    // Créer un projet
    const projet = await Projet.create({
      nom: 'Projet Test Objectifs',
      description: 'Projet pour tester les objectifs',
      date_debut: new Date('2026-06-01'),
      date_fin: new Date('2026-08-31'),
    });
    projetId = projet.id;

    // Ajouter les animateurs au projet
    await AnimateurProjet.create({
      animateur_id: animateur1Id,
      projet_id: projetId,
      role: 'coordinateur',
    });

    await AnimateurProjet.create({
      animateur_id: animateur2Id,
      projet_id: projetId,
      role: 'assistant',
    });

    // Créer quelques objectifs
    await Objectif.create({
      projet_id: projetId,
      texte: 'Objectif 1',
      ordre: 1,
      created_by: animateur1Id,
    });

    await Objectif.create({
      projet_id: projetId,
      texte: 'Objectif 2',
      ordre: 2,
      created_by: animateur2Id,
    });

    await Objectif.create({
      projet_id: projetId,
      texte: 'Objectif 3',
      ordre: 3,
      created_by: animateur1Id,
    });
  });

  afterEach(async () => {
    // Nettoyer
    await Objectif.destroy({ where: {} });
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Id }, force: true });
    await Animateur.destroy({ where: { id: animateur2Id }, force: true });
  });

  it('devrait récupérer la liste des objectifs d\'un projet', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetId);
    expect(response.body.count).toBe(3);
    expect(response.body.objectifs).toBeInstanceOf(Array);
    expect(response.body.objectifs.length).toBe(3);

    // Vérifier que les objectifs sont triés par ordre
    expect(response.body.objectifs[0].texte).toBe('Objectif 1');
    expect(response.body.objectifs[1].texte).toBe('Objectif 2');
    expect(response.body.objectifs[2].texte).toBe('Objectif 3');
  });

  it('devrait retourner une liste vide si aucun objectif', async () => {
    // Créer un nouveau projet sans objectifs
    const projetVide = await Projet.create({
      nom: 'Projet Vide',
    });

    const response = await request(app)
      .get(`/projets/${projetVide.id}/objectifs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetVide.id);
    expect(response.body.count).toBe(0);
    expect(response.body.objectifs).toEqual([]);

    // Nettoyer
    await Projet.destroy({ where: { id: projetVide.id }, force: true });
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .get(`/projets/00000000-0000-0000-0000-000000000000/objectifs`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const response = await request(app)
      .get(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait charger les détails complets quand with=details', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}/objectifs?with=details`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.objectifs).toBeInstanceOf(Array);

    // Vérifier que les données complètes sont incluses
    const obj1 = response.body.objectifs[0];
    expect(obj1.texte).toBe('Objectif 1');
    expect(obj1.created_by).toBe(animateur1Id);
    expect(obj1.createdByAnimateur).toBeDefined();
    expect(obj1.createdByAnimateur.id).toBe(animateur1Id);
    expect(obj1.createdByAnimateur.nom).toBe('Animateur 1');
    expect(obj1.createdByAnimateur.password).toBeUndefined(); // Mot de passe ne doit pas être retourné

    const obj2 = response.body.objectifs[1];
    expect(obj2.texte).toBe('Objectif 2');
    expect(obj2.created_by).toBe(animateur2Id);
    expect(obj2.createdByAnimateur.id).toBe(animateur2Id);
    expect(obj2.createdByAnimateur.nom).toBe('Animateur 2');
  });

  it('ne devrait pas retourner les objectifs supprimés', async () => {
    // Supprimer un objectif (soft delete avec deleted_at)
    await Objectif.update({ deleted_at: new Date() }, { where: { texte: 'Objectif 2' } });

    const response = await request(app)
      .get(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(2);
    expect(response.body.objectifs.length).toBe(2);

    const textes = response.body.objectifs.map((o: any) => o.texte);
    expect(textes).not.toContain('Objectif 2');
    expect(textes).toContain('Objectif 1');
    expect(textes).toContain('Objectif 3');
  });

  it('devrait conserver les objectifs dont le créateur a été supprimé quand with=details', async () => {
    // Supprimer l'animateur 1
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateur1Id } });

    const response = await request(app)
      .get(`/projets/${projetId}/objectifs?with=details`)
      .set('cookie', sessionCookie)
      .expect(200);

    // Devrait retourner tous les objectifs, y compris ceux créés par l'animateur supprimé
    expect(response.body.count).toBe(3);
    expect(response.body.objectifs.length).toBe(3);

    // Vérifier que les objectifs créés par l'animateur supprimé sont là avec les données complètes
    const obj1 = response.body.objectifs[0];
    expect(obj1.texte).toBe('Objectif 1');
    expect(obj1.created_by).toBe(animateur1Id);
    expect(obj1.createdByAnimateur).toBeDefined(); // L'animateur est présent
    expect(obj1.createdByAnimateur.id).toBe(animateur1Id);
    expect(obj1.createdByAnimateur.deleted_at).not.toBeNull(); // Marqué comme supprimé

    // Les objectifs créés par l'animateur 2 doivent aussi avoir les données complètes
    const obj2 = response.body.objectifs[1];
    expect(obj2.texte).toBe('Objectif 2');
    expect(obj2.created_by).toBe(animateur2Id);
    expect(obj2.createdByAnimateur).toBeDefined();
    expect(obj2.createdByAnimateur.id).toBe(animateur2Id);
    expect(obj2.createdByAnimateur.deleted_at).toBeNull(); // Pas supprimé
  });

  it('devrait trier les objectifs par ordre puis par date de création', async () => {
    // Créer un objectif sans ordre spécifié (ordre par défaut 0)
    await Objectif.create({
      projet_id: projetId,
      texte: 'Objectif sans ordre',
      created_by: animateur1Id,
    });

    const response = await request(app)
      .get(`/projets/${projetId}/objectifs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(4);

    // Objectif sans ordre (0) devrait être en premier
    expect(response.body.objectifs[0].texte).toBe('Objectif sans ordre');

    // Puis les autres par ordre croissant
    expect(response.body.objectifs[1].texte).toBe('Objectif 1');
    expect(response.body.objectifs[2].texte).toBe('Objectif 2');
    expect(response.body.objectifs[3].texte).toBe('Objectif 3');
  });
});

