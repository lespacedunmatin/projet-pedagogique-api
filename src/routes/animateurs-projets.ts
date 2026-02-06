import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';

const router = express.Router();

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

    // Charger les données complètes des animateurs
    let result = await Promise.all(
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

export default router;
