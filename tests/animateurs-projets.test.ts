import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import bcrypt from 'bcrypt';
import { getAuthenticatedSession } from './helpers';

describe('POST /projets/:id/animateurs', () => {
  let projetId: string;
  let animateur1Id: string;
  let sessionCookie: string;

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Test Animateur 1',
    });
    animateur1Id = animateur.id;

    // Créer un projet de test
    const projet = await Projet.create({
      nom: 'Projet Test',
    });
    projetId = projet.id;

    // Affecter le premier animateur au projet
    await AnimateurProjet.create({
      animateur_id: animateur1Id,
      projet_id: projetId,
      role: 'coordinateur',
    });

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateur1Id, 'password123');
  });

  afterEach(async () => {
    // Nettoyer
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Id }, force: true });
  });

  it('devrait ajouter un animateur au projet via son email', async () => {
    // Créer un deuxième animateur
    const animateur2 = await Animateur.create({
      email: `test2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Test Animateur 2',
    });

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: animateur2.email,
        role: 'assistant',
      })
      .expect(201);

    expect(response.body.message).toBe('Animateur ajouté au projet avec succès');
    expect(response.body.animateur_affecte.animateur_id).toBe(animateur2.id);
    expect(response.body.animateur_affecte.projet_id).toBe(projetId);
    expect(response.body.animateur_affecte.role).toBe('assistant');

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2.id }, force: true });
  });

  it('devrait ajouter un animateur sans rôle spécifié', async () => {
    // Créer un deuxième animateur
    const animateur2 = await Animateur.create({
      email: `test3-${Date.now()}@example.com`,
      password: await bcrypt.hash('password789', 10),
      nom: 'Test Animateur 3',
    });

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: animateur2.email,
      })
      .expect(201);

    expect(response.body.animateur_affecte.role).toBeUndefined();

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2.id }, force: true });
  });

  it('devrait retourner une erreur 400 si l\'email est manquant', async () => {
    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({})
      .expect(400);

    expect(response.body.error).toBe('L\'email est obligatoire');
  });

  it('devrait retourner une erreur 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .post(`/projets/00000000-0000-0000-0000-000000000000/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: 'test@example.com',
      })
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner une erreur 404 si l\'animateur n\'existe pas', async () => {
    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: 'nonexistent@example.com',
      })
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner une erreur 409 si l\'animateur est déjà affecté au projet', async () => {
    // Créer un nouvel animateur et l'ajouter
    const animateur2 = await Animateur.create({
      email: `test-double-${Date.now()}@example.com`,
      password: await bcrypt.hash('password', 10),
      nom: 'Animateur Double',
    });

    await AnimateurProjet.create({
      animateur_id: animateur2.id,
      projet_id: projetId,
      role: 'assistant',
    });

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: animateur2.email,
      })
      .expect(409);

    expect(response.body.error).toBe('Cet animateur est déjà affecté à ce projet');

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2.id }, force: true });
  });

  it('devrait retourner une erreur 404 si l\'animateur est supprimé', async () => {
    // Créer un animateur et le supprimer
    const animateur2 = await Animateur.create({
      email: `test-supprime-${Date.now()}@example.com`,
      password: await bcrypt.hash('password', 10),
      nom: 'Animateur Supprimé',
    });

    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateur2.id } });

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: animateur2.email,
      })
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2.id }, force: true });
  });

  it('devrait retourner une erreur 404 si le projet est supprimé', async () => {
    // Créer un animateur
    const animateur2 = await Animateur.create({
      email: `test-projet-supprime-${Date.now()}@example.com`,
      password: await bcrypt.hash('password', 10),
      nom: 'Test',
    });

    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .send({
        email: animateur2.email,
      })
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2.id }, force: true });
  });
});

describe('GET /projets/:projet_id/animateurs', () => {
  let projetId: string;
  let animateur1Id: string;
  let animateur2Id: string;
  let sessionCookie: string;

  beforeEach(async () => {
    // Créer deux animateurs
    const animateur1 = await Animateur.create({
      email: `test1-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Test Animateur 1',
    });
    animateur1Id = animateur1.id;

    const animateur2 = await Animateur.create({
      email: `test2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Test Animateur 2',
    });
    animateur2Id = animateur2.id;

    // Créer un projet
    const projet = await Projet.create({
      nom: 'Projet Test',
    });
    projetId = projet.id;

    // Ajouter les deux animateurs au projet
    await AnimateurProjet.create({
      animateur_id: animateur1Id,
      projet_id: projetId,
      role: 'coordinateur',
    });

    await AnimateurProjet.create({
      animateur_id: animateur2.id,
      projet_id: projetId,
      role: 'assistant',
    });

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateur1Id, 'password123');
  });

  afterEach(async () => {
    // Nettoyer
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Id }, force: true });
    await Animateur.destroy({ where: { id: animateur2Id }, force: true });
  });

  it('devrait retourner la liste des animateurs du projet sans détails', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetId);
    expect(response.body.count).toBe(2);
    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(2);

    // Vérifier les données retournées
    const anim1 = response.body.animateurs.find((a: any) => a.animateur.id === animateur1Id);
    expect(anim1).toBeDefined();
    expect(anim1.role).toBe('coordinateur');

    const anim2 = response.body.animateurs.find((a: any) => a.animateur.id === animateur2Id);
    expect(anim2).toBeDefined();
    expect(anim2.role).toBe('assistant');
  });

  it('devrait retourner une liste vide si aucun animateur', async () => {
    // Créer un nouveau projet sans animateurs
    const projetVide = await Projet.create({
      nom: 'Projet Vide',
    });

    const response = await request(app)
      .get(`/projets/${projetVide.id}/animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetVide.id);
    expect(response.body.count).toBe(0);
    expect(response.body.animateurs).toEqual([]);

    // Nettoyer
    await Projet.destroy({ where: { id: projetVide.id }, force: true });
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .get(`/projets/00000000-0000-0000-0000-000000000000/animateurs`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('ne devrait pas retourner les animateurs supprimés', async () => {
    // Supprimer un animateur (soft delete)
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateur1Id } });

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs?with=details`)
      .set('cookie', sessionCookie)
      .expect(200);

    // Devrait retourner seulement animateur2
    expect(response.body.count).toBe(1);
    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur2Id);
  });

  it('ne devrait pas retourner les liaisons supprimées', async () => {
    // Supprimer la liaison (soft delete)
    const liaison = await AnimateurProjet.findOne({
      where: { animateur_id: animateur1Id, projet_id: projetId },
    });

    await AnimateurProjet.update({ deleted_at: new Date() }, { where: { id: liaison!.id } });

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    // Devrait retourner seulement animateur2
    expect(response.body.count).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur2Id);
  });
});
