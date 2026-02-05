import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur, {AnimateurCreationAttributes} from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import Objectif from '../src/models/Objectif';
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

    await AnimateurProjet.create({
      animateur_id: animateur2Data.id,
      projet_id: projetId,
      role: 'assistant',
    });
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

describe('POST /projets/:id/animateurs', () => {
  let projetId: string;
  let animateur1Id: string;

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
      .send({})
      .expect(400);

    expect(response.body.error).toBe('L\'email est obligatoire');
  });

  it('devrait retourner une erreur 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .post(`/projets/550e8400-e29b-41d4-a716-446655440999/animateurs`)
      .send({
        email: 'test@example.com',
      })
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner une erreur 404 si l\'animateur n\'existe pas', async () => {
    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
      .send({
        email: 'inexistant@example.com',
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

    await Animateur.update(
      { deleted_at: new Date() },
      { where: { id: animateur2.id } }
    );

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
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
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetId } }
    );

    const response = await request(app)
      .post(`/projets/${projetId}/animateurs`)
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

  beforeEach(async () => {
    // Créer deux animateurs
    const animateur1 = await Animateur.create({
      email: `test1-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Animateur 1',
    });
    animateur1Id = animateur1.id;

    const animateur2 = await Animateur.create({
      email: `test2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Animateur 2',
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
      animateur_id: animateur2Id,
      projet_id: projetId,
      role: 'assistant',
    });
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
      .expect(200);

    expect(response.body.projet_id).toBe(projetVide.id);
    expect(response.body.count).toBe(0);
    expect(response.body.animateurs).toEqual([]);

    // Nettoyer
    await Projet.destroy({ where: { id: projetVide.id }, force: true });
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .get(`/projets/550e8400-e29b-41d4-a716-446655440999/animateurs`)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetId } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs`)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('ne devrait pas retourner les animateurs supprimés', async () => {
    // Supprimer un animateur (soft delete)
    await Animateur.update(
      { deleted_at: new Date() },
      { where: { id: animateur1Id } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs?with=details`)
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

    await AnimateurProjet.update(
      { deleted_at: new Date() },
      { where: { id: liaison!.id } }
    );

    const response = await request(app)
      .get(`/projets/${projetId}/animateurs`)
      .expect(200);

    // Devrait retourner seulement animateur2
    expect(response.body.count).toBe(1);
    expect(response.body.animateurs[0].animateur.id).toBe(animateur2Id);
  });
});

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

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet (soft delete)
    await Projet.update(
      { deleted_at: new Date() },
      { where: { id: projetId } }
    );

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

