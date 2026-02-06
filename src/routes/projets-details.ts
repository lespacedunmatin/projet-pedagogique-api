import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';

const router = express.Router();

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

export default router;
