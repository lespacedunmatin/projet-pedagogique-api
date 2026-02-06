import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import Objectif from '../src/models/Objectif';
import bcrypt from 'bcrypt';

describe('POST /projets/:projet_id/objectifs', () => {
  let animateurId: string;
  let projetId: string;

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
      .send(objectifData)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });
});
