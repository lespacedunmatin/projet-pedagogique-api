import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';
import Objectif from '../models/Objectif';

const router = express.Router();

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

    // Vérifier que l'animateur existe et n'est pas supprimé
    const animateur = await Animateur.findOne({
      where: { id: animateur_id, deleted_at: null },
    });

    if (!animateur) {
      return res.status(404).json({ error: 'Animateur non trouvé' });
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
