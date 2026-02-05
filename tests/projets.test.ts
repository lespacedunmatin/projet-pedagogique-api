import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur, {AnimateurCreationAttributes} from '../src/models/Animateur';
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

describe('GET /projets/:id', () => {
  let projetId: string;
  const animateur1Data: AnimateurCreationAttributes = {
    email: `test1-${Date.now()}@example.com`,
    password: 'p@ssw0rd123',
    nom: 'Test Animateur 1'
  }
  const animateur2Data: AnimateurCreationAttributes = {
    email: `test2-${Date.now()}@example.com`,
    password: 'passw@rd456',
    nom: 'Test Animateur 2',
    bio: 'Deuxième animateur'
  }
  const ajouterAnimateur2 = async () => {
    // Ajouter un deuxième animateur
    const animateur2 = await Animateur.create({
      email: animateur2Data.email,
      password: await bcrypt.hash(animateur2Data.password, 10),
      nom: animateur2Data.nom,
      bio: animateur2Data.bio
    });

    animateur2Data.id = animateur2.id;
    console.log(animateur2Data);

    await AnimateurProjet.create({
      animateur_id: animateur2Data.id,
      projet_id: projetId,
      role: 'assistant',
    });
    console.log('animateru 2 et liaison créés');
  }

  beforeEach(async () => {
    // Créer un animateur de test
    const animateur = await Animateur.create({
      email: animateur1Data.email,
      password: await bcrypt.hash(animateur1Data.password, 10),
      nom: animateur1Data.nom,
    });
    animateur1Data.id = animateur.id;

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

  it('devrait récupérer les détails d\'un projet', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}`)
      .expect(200);

    expect(response.body.projet).toBeDefined();
    expect(response.body.projet.id).toBe(projetId);
    expect(response.body.projet.nom).toBe('Projet Test');

    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur_id).toBe(animateur1Data.id);
  });

  it('devrait retourner une erreur 404 si le projet n\'existe pas', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440999';
    const response = await request(app)
      .get(`/projets/${fakeId}`)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner une erreur 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetId } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}`)
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
      .expect(200);

    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur_id).toBe(animateur1Data.id);

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait retourner les animateurs avec détails complets quand with=animateurs', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
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
    await Animateur.update(
      { deleted_at: new Date() },
      { where: { id: animateur2Data.id } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}?with=animateurs`)
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
      .expect(200);

    expect(response.body.animateurs.length).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur1Data.id);

    // Nettoyer
    await Animateur.destroy({ where: { id: animateur2Data.id }, force: true });
  });

  it('devrait retourner les liaisons seulement sans détails d\'animateurs par défaut', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}`)
      .expect(200);

    expect(response.body.animateurs).toBeInstanceOf(Array);
    expect(response.body.animateurs.length).toBe(1);

    // Sans with=animateurs, doit retourner les liaisons AnimateurProjet directement
    const animateurData = response.body.animateurs[0];
    expect(animateurData.animateur_id).toBe(animateur1Data.id);
    expect(animateurData.animateur).toBeUndefined(); // L'objet animateur ne doit pas être inclus
  });
});
