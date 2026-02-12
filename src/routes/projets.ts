import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';
import projetDetailsRouter from './projets-details';
import animateursProjetRouter from './animateurs-projets';
import objectifsProjetRouter from './objectifs-projets';
import activitesProjetRouter from './activites-projets';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(isAuthenticated);

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
    // Vérifier si l'utilisateur est authentifié
    const animateur_id = (req.session as any).userId;
    const { nom, description, date_debut, date_fin, role } = req.body;

    if (!animateur_id) {
      return res.status(401).json({
        error: 'Vous devez être authentifié pour accéder à cette ressource',
      });
    }

    // Validation des champs obligatoires
    if (!nom) {
      return res.status(400).json({
        error: 'Le champs nom est obligatoire',
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

// Intégrer les sous-routeurs
router.use('/', projetDetailsRouter);
router.use('/', animateursProjetRouter);
router.use('/', objectifsProjetRouter);
router.use('/', activitesProjetRouter);

export default router;
