import request from 'supertest';
import app from '../src/server';
import Projet from '../src/models/Projet';
import Animateur from '../src/models/Animateur';
import AnimateurProjet from '../src/models/AnimateurProjet';
import Activite from '../src/models/Activite';
import bcrypt from 'bcrypt';
import { getAuthenticatedSession } from './helpers';

describe('POST /projets/:projet_id/activites', () => {
  let animateur1Id: string;
  let animateur2Id: string;
  let projetId: string;
  let sessionCookie: string;
  const projetDebut = new Date('2026-06-01');
  const projetFin = new Date('2026-08-31');

  beforeEach(async () => {
    // Créer deux animateurs
    const animateur1 = await Animateur.create({
      email: `test1-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Animateur 1',
    });
    animateur1Id = animateur1.id;

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateur1Id, 'password123');

    const animateur2 = await Animateur.create({
      email: `test2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Animateur 2',
    });
    animateur2Id = animateur2.id;

    // Créer un projet
    const projet = await Projet.create({
      nom: 'Projet Test Activites',
      description: 'Projet pour tester les activités',
      date_debut: projetDebut,
      date_fin: projetFin,
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
    // Nettoyer les données créées
    await Activite.destroy({ where: {} });
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Id }, force: true });
    await Animateur.destroy({ where: { id: animateur2Id }, force: true });
  });

  it('devrait créer une activité avec succès', async () => {
    const activiteData = {
      nom: 'Atelier de programmation',
      description: 'Atelier pratique sur les bases de la programmation',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      ordre: 1,
      responsable_id: animateur2Id,
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(201);

    expect(response.body.message).toBe('Activité créée avec succès');
    expect(response.body.activite).toBeDefined();
    expect(response.body.activite.id).toBeDefined();
    expect(response.body.activite.nom).toBe(activiteData.nom);
    expect(response.body.activite.description).toBe(activiteData.description);
    expect(response.body.activite.responsable_id).toBe(animateur2Id);
    expect(response.body.activite.ordre).toBe(1);
    expect(response.body.activite.created_by).toBe(animateur1Id);
  });

  it('devrait créer une activité sans responsable', async () => {
    const activiteData = {
      nom: 'Activité sans responsable',
      date_debut: '2026-07-01',
      date_fin: '2026-07-05',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(201);

    expect(response.body.activite.responsable_id).toBeNull();
    expect(response.body.activite.ordre).toBe(0); // ordre par défaut
  });

  it('devrait retourner 400 si le nom est manquant', async () => {
    const activiteData = {
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('Le champ nom est obligatoire');
  });

  it('devrait retourner 400 si date_debut est manquante', async () => {
    const activiteData = {
      nom: 'Activité',
      date_fin: '2026-06-20',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('Le champ date_debut est obligatoire');
  });

  it('devrait retourner 400 si date_fin est manquante', async () => {
    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('Le champ date_fin est obligatoire');
  });

  it('devrait retourner 400 si animateur_id est manquant', async () => {
    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('Le champ animateur_id est obligatoire');
  });

  it('devrait retourner 400 si date_fin est avant date_debut', async () => {
    const activiteData = {
      nom: 'Activité avec dates invalides',
      date_debut: '2026-06-20',
      date_fin: '2026-06-15',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('La date de fin doit être après la date de début');
  });

  it('devrait retourner 400 si les dates dépassent la période du projet', async () => {
    const activiteData = {
      nom: 'Activité hors période',
      date_debut: '2026-05-01',
      date_fin: '2026-06-15',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(400);

    expect(response.body.error).toBe('Les dates de l\'activité doivent être dans la période du projet');
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/00000000-0000-0000-0000-000000000000/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si l\'animateur n\'existe pas', async () => {
    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      animateur_id: '00000000-0000-0000-0000-000000000000',
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(404);

    expect(response.body.error).toBe('Animateur non trouvé');
  });

  it('devrait retourner 403 si l\'animateur n\'est pas membre du projet', async () => {
    // Créer un animateur non affecté au projet
    const autreAnimateur = await Animateur.create({
      email: `autre-${Date.now()}@example.com`,
      password: await bcrypt.hash('password789', 10),
      nom: 'Autre Animateur',
    });

    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      animateur_id: autreAnimateur.id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(403);

    expect(response.body.error).toBe('Cet animateur n\'est pas membre du projet');

    // Nettoyer
    await Animateur.destroy({ where: { id: autreAnimateur.id }, force: true });
  });

  it('devrait retourner 404 si le responsable n\'existe pas', async () => {
    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      responsable_id: '00000000-0000-0000-0000-000000000000',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(404);

    expect(response.body.error).toBe('Responsable non trouvé');
  });

  it('devrait retourner 403 si le responsable n\'est pas membre du projet', async () => {
    // Créer un animateur non affecté au projet
    const autreAnimateur = await Animateur.create({
      email: `autre2-${Date.now()}@example.com`,
      password: await bcrypt.hash('password789', 10),
      nom: 'Autre Animateur 2',
    });

    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      responsable_id: autreAnimateur.id,
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(403);

    expect(response.body.error).toBe('Le responsable n\'est pas membre du projet');

    // Nettoyer
    await Animateur.destroy({ where: { id: autreAnimateur.id }, force: true });
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const activiteData = {
      nom: 'Activité',
      date_debut: '2026-06-15',
      date_fin: '2026-06-20',
      animateur_id: animateur1Id,
    };

    const response = await request(app)
      .post(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .send(activiteData)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });
});

describe('GET /projets/:projet_id/activites', () => {
  let animateur1Id: string;
  let animateur2Id: string;
  let projetId: string;
  let sessionCookie: string;
  const projetDebut = new Date('2026-06-01');
  const projetFin = new Date('2026-08-31');

  beforeEach(async () => {
    // Créer deux animateurs
    const animateur1 = await Animateur.create({
      email: `test1-get-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      nom: 'Animateur 1 GET',
    });
    animateur1Id = animateur1.id;

    // Établir une session authentifiée
    sessionCookie = await getAuthenticatedSession(animateur1Id, 'password123');

    const animateur2 = await Animateur.create({
      email: `test2-get-${Date.now()}@example.com`,
      password: await bcrypt.hash('password456', 10),
      nom: 'Animateur 2 GET',
    });
    animateur2Id = animateur2.id;

    // Créer un projet
    const projet = await Projet.create({
      nom: 'Projet Test GET Activites',
      description: 'Projet pour tester GET activités',
      date_debut: projetDebut,
      date_fin: projetFin,
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

    // Créer quelques activités
    await Activite.create({
      projet_id: projetId,
      nom: 'Activité 1',
      date_debut: new Date('2026-06-15'),
      date_fin: new Date('2026-06-20'),
      responsable_id: animateur2Id,
      ordre: 1,
      created_by: animateur1Id,
    });

    await Activite.create({
      projet_id: projetId,
      nom: 'Activité 2',
      date_debut: new Date('2026-07-01'),
      date_fin: new Date('2026-07-05'),
      responsable_id: null,
      ordre: 2,
      created_by: animateur2Id,
    });

    await Activite.create({
      projet_id: projetId,
      nom: 'Activité 3',
      date_debut: new Date('2026-08-10'),
      date_fin: new Date('2026-08-15'),
      responsable_id: animateur1Id,
      ordre: 3,
      created_by: animateur1Id,
    });
  });

  afterEach(async () => {
    // Nettoyer
    await Activite.destroy({ where: {} });
    await AnimateurProjet.destroy({ where: {} });
    await Projet.destroy({ where: { id: projetId }, force: true });
    await Animateur.destroy({ where: { id: animateur1Id }, force: true });
    await Animateur.destroy({ where: { id: animateur2Id }, force: true });
  });

  it('devrait récupérer la liste des activités d\'un projet', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetId);
    expect(response.body.count).toBe(3);
    expect(response.body.activites).toBeInstanceOf(Array);
    expect(response.body.activites.length).toBe(3);

    // Vérifier que les activités sont triées par ordre
    expect(response.body.activites[0].nom).toBe('Activité 1');
    expect(response.body.activites[1].nom).toBe('Activité 2');
    expect(response.body.activites[2].nom).toBe('Activité 3');
  });

  it('devrait retourner une liste vide si aucune activité', async () => {
    // Créer un nouveau projet sans activités
    const projetVide = await Projet.create({
      nom: 'Projet Vide',
      date_debut: projetDebut,
      date_fin: projetFin,
    });

    const response = await request(app)
      .get(`/projets/${projetVide.id}/activites`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.projet_id).toBe(projetVide.id);
    expect(response.body.count).toBe(0);
    expect(response.body.activites).toEqual([]);

    // Nettoyer
    await Projet.destroy({ where: { id: projetVide.id }, force: true });
  });

  it('devrait retourner 404 si le projet n\'existe pas', async () => {
    const response = await request(app)
      .get(`/projets/00000000-0000-0000-0000-000000000000/activites`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait retourner 404 si le projet est supprimé', async () => {
    // Supprimer le projet
    await Projet.update({ deleted_at: new Date() }, { where: { id: projetId } });

    const response = await request(app)
      .get(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .expect(404);

    expect(response.body.error).toBe('Projet non trouvé');
  });

  it('devrait charger les détails complets quand with=details', async () => {
    const response = await request(app)
      .get(`/projets/${projetId}/activites?with=details`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(3);
    expect(response.body.activites).toBeInstanceOf(Array);

    // Vérifier que les données complètes sont incluses
    const act1 = response.body.activites[0];
    expect(act1.nom).toBe('Activité 1');
    expect(act1.created_by).toBe(animateur1Id);
    expect(act1.responsable_id).toBe(animateur2Id);
    expect(act1.createdByAnimateur).toBeDefined();
    expect(act1.createdByAnimateur.id).toBe(animateur1Id);
    expect(act1.createdByAnimateur.nom).toBe('Animateur 1 GET');
    expect(act1.createdByAnimateur.password).toBeUndefined(); // Mot de passe ne doit pas être retourné
    expect(act1.responsableAnimateur).toBeDefined();
    expect(act1.responsableAnimateur.id).toBe(animateur2Id);

    const act2 = response.body.activites[1];
    expect(act2.nom).toBe('Activité 2');
    expect(act2.responsable_id).toBeNull();
    expect(act2.responsableAnimateur).toBeNull();
  });

  it('ne devrait pas retourner les activités supprimées', async () => {
    // Supprimer une activité (soft delete)
    await Activite.update({ deleted_at: new Date() }, { where: { nom: 'Activité 2' } });

    const response = await request(app)
      .get(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(2);
    expect(response.body.activites.length).toBe(2);

    const noms = response.body.activites.map((a: any) => a.nom);
    expect(noms).not.toContain('Activité 2');
    expect(noms).toContain('Activité 1');
    expect(noms).toContain('Activité 3');
  });

  it('devrait conserver les activités dont le créateur a été supprimé quand with=details', async () => {
    // Supprimer l'animateur 1
    await Animateur.update({ deleted_at: new Date() }, { where: { id: animateur1Id } });

    const response = await request(app)
      .get(`/projets/${projetId}/activites?with=details`)
      .set('cookie', sessionCookie)
      .expect(200);

    // Devrait retourner toutes les activités
    expect(response.body.count).toBe(3);
    expect(response.body.activites.length).toBe(3);

    // Vérifier que les activités créées par l'animateur supprimé sont là avec createdByAnimateur = null
    const act1 = response.body.activites.find((a: any) => a.nom === 'Activité 1');
    expect(act1.created_by).toBe(animateur1Id);
    expect(act1.createdByAnimateur).toBeNull(); // L'animateur a été supprimé

    // Les activités créées par l'animateur 2 doivent avoir les données complètes
    const act2 = response.body.activites.find((a: any) => a.nom === 'Activité 2');
    expect(act2.created_by).toBe(animateur2Id);
    expect(act2.createdByAnimateur).toBeDefined();
    expect(act2.createdByAnimateur.id).toBe(animateur2Id);
  });

  it('devrait trier les activités par ordre puis par date de création', async () => {
    // Créer une activité sans ordre spécifié (ordre par défaut 0)
    await Activite.create({
      projet_id: projetId,
      nom: 'Activité sans ordre',
      date_debut: new Date('2026-06-01'),
      date_fin: new Date('2026-06-05'),
      ordre: 0,
      created_by: animateur1Id,
    });

    const response = await request(app)
      .get(`/projets/${projetId}/activites`)
      .set('cookie', sessionCookie)
      .expect(200);

    expect(response.body.count).toBe(4);

    // Activité sans ordre (0) devrait être en premier
    expect(response.body.activites[0].nom).toBe('Activité sans ordre');

    // Puis les autres par ordre croissant
    expect(response.body.activites[1].nom).toBe('Activité 1');
    expect(response.body.activites[2].nom).toBe('Activité 2');
    expect(response.body.activites[3].nom).toBe('Activité 3');
  });
});

