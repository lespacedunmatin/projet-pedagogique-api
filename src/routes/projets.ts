import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';
import Objectif from '../models/Objectif';

const router = express.Router();

/**
 * POST /projets
 * Crée un nouveau projet et affecte un animateur initial
 * Body: {
 *   nom: string,
 *   description?: string,
 *   date_debut?: Date,
 *   date_fin?: Date,
 *   animateur_id: string (UUID de l'animateur initial),
 *   role?: string (rôle de l'animateur dans le projet)
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nom, description, date_debut, date_fin, animateur_id, role } = req.body;

    // Validation des champs obligatoires
    if (!nom || !animateur_id) {
      return res.status(400).json({
        error: 'Les champs nom et animateur_id sont obligatoires',
      });
    }

    // Vérifier que l'animateur existe et n'est pas supprimé
    const animateur = await Animateur.findByPk(animateur_id);
    if (!animateur || animateur.deleted_at !== null) {
      return res.status(404).json({
        error: 'Animateur non trouvé',
      });
    }

    // Validation des dates
    if (date_debut && date_fin && new Date(date_debut) > new Date(date_fin)) {
      return res.status(400).json({
        error: 'La date de début doit être avant la date de fin',
      });
    }

    // Créer le projet
    const projet = await Projet.create({
      nom,
      description: description || undefined,
      date_debut: date_debut || undefined,
      date_fin: date_fin || undefined,
    });

    // Affecter l'animateur initial au projet
    const liaison = await AnimateurProjet.create({
      animateur_id,
      projet_id: projet.id,
      role: role || undefined,
    });

    // Retourner le projet créé avec l'animateur affecté
    const projetResponse = projet.toJSON();

    return res.status(201).json({
      message: 'Projet créé avec succès',
      projet: projetResponse,
      animateur_affecte: {
        id: liaison.id,
        animateur_id: liaison.animateur_id,
        role: liaison.role,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création du projet',
    });
  }
});

/**
 * GET /projets
 * Récupère la liste de tous les projets non supprimés
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projets = await Projet.findAll({
      where: {
        deleted_at: null,
      },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      count: projets.length,
      projets,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des projets',
    });
  }
});

/**
 * GET /projets/:id
 * Récupère les détails d'un projet spécifique avec les animateurs associés
 * Query params: with (optionnel) - "animateurs" pour inclure les détails complets des animateurs
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const withAnimateurs = req.query.with === 'animateurs';

    const projet = await Projet.findByPk(id);

    // Vérifier que le projet existe et n'est pas supprimé
    if (!projet || projet.deleted_at !== null) {
      return res.status(404).json({
        error: 'Projet non trouvé',
      });
    }

    // Récupérer les liaisons animateur-projet non supprimées
    const liaisons = await AnimateurProjet.findAll({
      where: {
        projet_id: id,
        deleted_at: null,
      },
    });

    // Si with=animateurs, charger les données complètes des animateurs
    let animateursList: any[] = liaisons;

    if (withAnimateurs) {
      animateursList = await Promise.all(
        liaisons.map(async (liaison: any) => {
          const animateur = await Animateur.findByPk(liaison.animateur_id, {
            attributes: {
              exclude: ['password'], // Ne pas retourner le mot de passe
            },
          });

          return {
            liaison_id: liaison.id,
            role: liaison.role,
            created_at: liaison.created_at,
            animateur,
          };
        })
      );

      // Filtrer les animateurs supprimés (soft delete)
      animateursList = animateursList.filter(
        (item: any) => item.animateur !== null && item.animateur.deleted_at === null
      );
    }

    return res.status(200).json({
      projet,
      animateurs: animateursList,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération du projet',
    });
  }
});

/**
 * POST /projets/:id/animateurs
 * Ajoute un animateur à un projet via son email
 * Body: {
 *   email: string (email de l'animateur à ajouter),
 *   role?: string (rôle optionnel de l'animateur dans le projet)
 * }
 */
router.post('/:id/animateurs', async (req: Request, res: Response) => {
  try {
    const projetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { email, role } = req.body;

    // Validation des paramètres
    if (!email) {
      return res.status(400).json({ error: 'L\'email est obligatoire' });
    }

    // Vérifier que le projet existe et n'est pas supprimé
    const projet = await Projet.findOne({
      where: { id: projetId, deleted_at: null },
    });

    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Trouver l'animateur par email
    const animateur = await Animateur.findOne({
      where: { email, deleted_at: null },
    });

    if (!animateur) {
      return res.status(404).json({ error: 'Animateur non trouvé' });
    }

    // Vérifier que l'animateur n'est pas déjà affecté au projet
    const liaisonExistante = await AnimateurProjet.findOne({
      where: {
        animateur_id: animateur.id,
        projet_id: projetId,
        deleted_at: null,
      },
    });

    if (liaisonExistante) {
      return res.status(409).json({
        error: 'Cet animateur est déjà affecté à ce projet',
      });
    }

    // Créer la liaison
    const liaison = await AnimateurProjet.create({
      animateur_id: animateur.id,
      projet_id: projetId,
      role: role || undefined,
    });

    return res.status(201).json({
      message: 'Animateur ajouté au projet avec succès',
      animateur_affecte: {
        id: liaison.id,
        animateur_id: liaison.animateur_id,
        projet_id: liaison.projet_id,
        role: liaison.role,
        created_at: liaison.created_at,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'animateur au projet :', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de l\'ajout de l\'animateur',
    });
  }
});

/**
 * GET /projets/:projet_id/animateurs
 * Récupère la liste des animateurs d'un projet
 * Query params: with (optionnel) - "details" pour inclure les détails complets des animateurs
 */
router.get('/:projet_id/animateurs', async (req: Request, res: Response) => {
  try {
    const projetId = Array.isArray(req.params.projet_id) ? req.params.projet_id[0] : req.params.projet_id;

    // Vérifier que le projet existe et n'est pas supprimé
    const projet = await Projet.findOne({
      where: { id: projetId, deleted_at: null },
    });

    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Récupérer les liaisons animateur-projet non supprimées
    const liaisons = await AnimateurProjet.findAll({
      where: {
        projet_id: projetId,
        deleted_at: null,
      },
      order: [['created_at', 'ASC']],
    });

    // Si with=details, charger les données complètes des animateurs
    let result: any[] = liaisons;

    result = await Promise.all(
      liaisons.map(async (liaison: any) => {
        const animateur = await Animateur.findByPk(liaison.animateur_id, {
          attributes: {
            exclude: ['password'],
          },
        });

        return {
          liaison_id: liaison.id,
          role: liaison.role,
          created_at: liaison.created_at,
          animateur: animateur && animateur.deleted_at === null ? animateur : null,
        };
      })
    );

    // Filtrer les animateurs supprimés
    result = result.filter((item: any) => item.animateur !== null);

    return res.status(200).json({
      projet_id: projetId,
      count: result.length,
      animateurs: result,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des animateurs du projet:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la récupération des animateurs',
    });
  }
});

/**
 * POST /projets/:projet_id/objectifs
 * Crée un nouvel objectif pour un projet
 * Body: {
 *   texte: string (contenu de l'objectif),
 *   ordre?: number (position optionnelle),
 *   animateur_id: string (UUID de l'animateur qui crée l'objectif)
 * }
 */
router.post('/:projet_id/objectifs', async (req: Request, res: Response) => {
  try {
    const projetId = Array.isArray(req.params.projet_id) ? req.params.projet_id[0] : req.params.projet_id;
    const { texte, ordre, animateur_id } = req.body;

    // Validation des paramètres obligatoires
    if (!texte) {
      return res.status(400).json({ error: 'Le champ texte est obligatoire' });
    }

    if (!animateur_id) {
      return res.status(400).json({ error: 'Le champ animateur_id est obligatoire' });
    }

    // Vérifier que le projet existe et n'est pas supprimé
    const projet = await Projet.findOne({
      where: { id: projetId, deleted_at: null },
    });

    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier que l'animateur est membre du projet
    const liaisonAnimateurProjet = await AnimateurProjet.findOne({
      where: {
        animateur_id,
        projet_id: projetId,
        deleted_at: null,
      },
    });

    if (!liaisonAnimateurProjet) {
      return res.status(403).json({
        error: 'Cet animateur n\'est pas membre du projet',
      });
    }

    // Créer l'objectif
    const objectif = await Objectif.create({
      projet_id: projetId,
      texte,
      ordre: ordre || 0,
      created_by: animateur_id,
    });

    return res.status(201).json({
      message: 'Objectif créé avec succès',
      objectif: {
        id: objectif.id,
        projet_id: objectif.projet_id,
        texte: objectif.texte,
        ordre: objectif.ordre,
        created_by: objectif.created_by,
        created_at: objectif.created_at,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'objectif:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la création de l\'objectif',
    });
  }
});

export default router;
