import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur, { AnimateurCreationAttributes } from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import bcrypt from 'bcrypt';
import { getAuthenticatedSession } from './helpers';

describe('GET /projets/:id', () => {
  let projetId: string;
  let sessionCookie: string;
  const animateur1Data: AnimateurCreationAttributes = {
    email: `test1-${Date.now()}@example.com`,
    password: 'p@ssw0rd123',
    nom: 'Test Animateur 1',
  };
  const animateur2Data: AnimateurCreationAttributes = {
    email: `test2-${Date.now()}@example.com`,
    password: 'passw@rd456',
    nom: 'Test Animateur 2',
    bio: 'Deuxième animateur',
  };

  const ajouterAnimateur2 = async () => {
    // Ajouter un deuxième animateur
    const animateur2 = await Animateur.create({
      email: animateur2Data.email,
      password: await bcrypt.hash(animateur2Data.password, 10),
      nom: animateur2Data.nom,
      bio: animateur2Data.bio,
    });

    animateur2Data.id = animateur2.id;

    await AnimateurProjet.create({
      animateur_id: animateur2Data.id,
      projet_id: projetId,
      role: 'assistant',
    });
  };

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: animateur1Data.email,
      password: await bcrypt.hash(animateur1Data.password, 10),
      nom: animateur1Data.nom,
    });
    animateur1Data.id = animateur.id;

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateur1Data.id as string, 'p@ssw0rd123');

    // Créer un projet de test
    const projet = await Projet.create({
      nom: 'Projet Test',
      description: 'Description du projet',
    });
    projetId = projet.id;

    // Affecter l'animateur
    await AnimateurProjet.create({
      animateur_id: animateur1Data.id,
      projet_id: projetId,
      role: 'coordinateur',
    });
  });

  afterEach(async () => {
    // Nettoyer
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Data.id }, force: true });
  });

  it('devrait retourner les détails d\'un projet avec ses animateurs', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet).toBeDefined();
    expect(response.body.projet.id).toBe(projetId);
    expect(response.body.projet.nom).toBe('Projet Test');

    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur_id).toBe(animateur1Data.id);
  });

  it('devrait retourner une erreur 404 si le projet n\'existe pas', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';
    const response = await request(app)
      .get(`/projets/${fakeId}`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner une erreur 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const response = await request(app)
      .get(`/projets/${projetId}`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner seulement les animateurs non supprimés', async () => {
    // Ajouter un deuxième animateur
    await ajouterAnimateur2();

    // Supprimer une affectation
    await AnimateurProjet.update(
      { deleted_at: new Date() },
      { where: { animateur_id: animateur2Data.id, projet_id: projetId } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur_id).toBe(animateur1Data.id);

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait retourner les animateurs avec détails complets quand with=animateurs', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet).toBeDefined();
    expect(response.body.projet.id).toBe(projetId);
    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(1);

    // Vérifier que les données complètes de l'animateur sont incluses
    const animateurData = response.body.animateurs[0];
    expect(animateurData.animateur).toBeDefined();
    expect(animateurData.animateur.id).toBe(animateur1Data.id);
    expect(animateurData.animateur.email).toBe(animateur1Data.email);
    expect(animateurData.animateur.nom).toBe(animateur1Data.nom);
    expect(animateurData.animateur.password).toBeUndefined(); // Mot de passe ne doit pas être retourné
    expect(animateurData.role).toBe('coordinateur');
    expect(animateurData.liaison_id).toBeDefined();
    expect(animateurData.created_at).toBeDefined();
    expect(animateurData.deleted_at).toBeUndefined();
  });

  it('devrait charger plusieurs animateurs avec détails quand with=animateurs', async () => {
    // Ajouter un deuxième animateur
    await ajouterAnimateur2();

    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateurs.length).toBe(2);

    // Vérifier que les deux animateurs sont présents avec leurs détails
    const noms = response.body.animateurs.map((a: any) => a.animateur.nom);
    expect(noms).toContain(animateur1Data.nom);
    expect(noms).toContain(animateur2Data.nom);

    // Vérifier que les rôles sont corrects
    const roles = response.body.animateurs.map((a: any) => a.role);
    expect(roles).toContain('coordinateur');
    expect(roles).toContain('assistant');

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait exclure les animateurs supprimés quand with=animateurs', async () => {
    // Ajouter un deuxième animateur
    await ajouterAnimateur2();

    // Supprimer l'animateur
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateur2Data.id } });

    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur1Data.id);

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait exclure les liaisons supprimées quand with=animateurs', async () => {
    // Ajouter un deuxième animateur
    await ajouterAnimateur2();

    // Supprimer la liaison
    await AnimateurProjet.update(
      { deleted_at: new Date() },
      { where: { animateur_id: animateur2Data.id, projet_id: projetId } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur1Data.id);

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait retourner les liaisons seulement sans détails d\'animateurs par défaut', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(1);

    // Sans with=animateurs, doit retourner les liaisons AnimateurProjet directement
    const animateurData = response.body.animateurs[0];
    expect(animateurData.animateur_id).toBe(animateur1Data.id);
    expect(animateurData.animateur).toBeUndefined(); // L'objet animateur ne doit pas être inclus
  });
});
