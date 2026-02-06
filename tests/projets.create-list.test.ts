import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import bcrypt from 'bcrypt';

describe('POST /projets', () => {
  let animateurId: string;

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Test Animateur',
    });
    animateurId = animateur.id;
  });

  afterEach(async () => {
    // Nettoyer les projets et animateurs créés
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: {}, force: true });
    await Animateur.destroy({ where: { id: animateurId }, force: true });
  });

  it('devrait créer un projet avec un animateur initial', async () => {
    const projetData = {
      nom: 'Projet Été 2026',
      description: 'Activités estivales',
      date_debut: '2026-06-01',
      date_fin: '2026-08-31',
      animateur_id: animateurId,
      role: 'coordinateur',
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(201);

    expect(response.body.message).toBe('Projet créé avec succès');
    expect(response.body.projet).toBeDefined();
    expect(response.body.projet.id).toBeDefined();
    expect(response.body.projet.nom).toBe(projetData.nom);
    expect(response.body.projet.description).toBe(projetData.description);

    // Vérifier que l'animateur a été affecté
    expect(response.body.animateur_affecte).toBeDefined();
    expect(response.body.animateur_affecte.animateur_id).toBe(animateurId);
    expect(response.body.animateur_affecte.role).toBe('coordinateur');

    // Vérifier que la liaison a été créée en base de données
    const liaison = await AnimateurProjet.findByPk(response.body.animateur_affecte.id);
    expect(liaison).toBeDefined();
    expect(liaison!.projet_id).toBe(response.body.projet.id);
    expect(liaison!.animateur_id).toBe(animateurId);
  });

  it('devrait créer un projet sans rôle spécifié', async () => {
    const projetData = {
      nom: 'Projet Simple',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(201);

    expect(response.body.projet.nom).toBe(projetData.nom);
    expect(response.body.animateur_affecte.role).toBeUndefined();
  });

  it('devrait retourner une erreur 400 si le nom est manquant', async () => {
    const projetData = {
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(400);

    expect(response.body.error).toBe('Les champs nom et animateur_id sont obligatoires');
  });

  it('devrait retourner une erreur 400 si animateur_id est manquant', async () => {
    const projetData = {
      nom: 'Projet Sans Animateur',
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(400);

    expect(response.body.error).toBe('Les champs nom et animateur_id sont obligatoires');
  });

  it('devrait retourner une erreur 404 si l\'animateur n\'existe pas', async () => {
    const projetData = {
      nom: 'Projet Test',
      animateur_id: '550e8400-e29b-41d4-a716-446655440999',
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner une erreur 404 si l\'animateur est supprimé', async () => {
    // Supprimer l'animateur
    await Animateur.update(
      { deleted_at: new Date() },
      { where: { id: animateurId } }
    );

    const projetData = {
      nom: 'Projet Test',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner une erreur 400 si date_fin est avant date_debut', async () => {
    const projetData = {
      nom: 'Projet Dates Invalides',
      date_debut: '2026-08-31',
      date_fin: '2026-06-01',
      animateur_id: animateurId,
    };

    const response = await request(app)
      .post('/projets')
      .send(projetData)
      .expect(400);

    expect(response.body.error).toBe('La date de début doit être avant la date de fin');
  });
});

describe('GET /projets', () => {
  let animateurId: string;
  let projetIds: string[] = [];

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Test Animateur',
    });
    animateurId = animateur.id;

    // Créer quelques projets de test
    const projets = [
      { nom: 'Projet 1', animateur_id: animateurId, role: 'coordinateur' },
      { nom: 'Projet 2', animateur_id: animateurId, role: 'assistant' },
      { nom: 'Projet 3', animateur_id: animateurId, role: 'animateur' },
    ];

    for (const projetData of projets) {
      const projet = await Projet.create({
        nom: projetData.nom,
      });
      await AnimateurProjet.create({
        animateur_id: projetData.animateur_id,
        projet_id: projet.id,
        role: projetData.role,
      });
      projetIds.push(projet.id);
    }
  });

  afterEach(async () => {
    // Nettoyer
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: {}, force: true });
    await Animateur.destroy({ where: { id: animateurId }, force: true });
    projetIds = [];
  });

  it('devrait récupérer la liste de tous les projets', async () => {
    const response = await request(app)
      .get('/projets')
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.projets).toBeInstanceOf(Array);
    expect(response.body.projets.length).toBe(3);
  });

  it('devrait exclure les projets supprimés', async () => {
    // Supprimer un projet
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetIds[0] } }
    );

    const response = await request(app)
      .get('/projets')
      .expect(200);

    expect(response.body.count).toBe(2);
    expect(response.body.projets.length).toBe(2);

    const noms = response.body.projets.map((p: any) => p.nom);
    expect(noms).not.toContain('Projet 1');
  });

  it('devrait retourner un tableau vide si aucun projet n\'existe', async () => {
    // Supprimer tous les projets
    await Projet.destroy({ where: { id: projetIds }, force: true });

    const response = await request(app)
      .get('/projets')
      .expect(200);

    expect(response.body.count).toBe(0);
    expect(response.body.projets).toEqual([]);
  });
});
