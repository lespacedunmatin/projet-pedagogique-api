import express, { Request, Response } from 'express';
import Projet from '../models/Projet';
import AnimateurProjet from '../models/AnimateurProjet';
import Animateur from '../models/Animateur';
import Activite from '../models/Activite';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(isAuthenticated);

/**
 * POST /projets/:projet_id/activites
 * Crée une nouvelle activité pour un projet
 * Body: {
 *   nom: string (nom de l'activité),
 *   description?: string (description optionnelle),
 *   date_debut: Date (date de début),
 *   date_fin: Date (date de fin),
 *   responsable_id?: string (UUID optionnel de l'animateur responsable),
 *   ordre?: number (position optionnelle),
 *   animateur_id: string (UUID de l'animateur qui crée l'activité)
 * }
 */
router.post('/:projet_id/activites', async (req: Request, res: Response) => {
  try {
    const projetId = Array.isArray(req.params.projet_id) ? req.params.projet_id[0] : req.params.projet_id;
    const { nom, description, date_debut, date_fin, responsable_id, ordre, animateur_id } = req.body;

    // Validation des paramètres obligatoires
    if (!nom) {
      return res.status(400).json({ error: 'Le champ nom est obligatoire' });
    }

    if (!date_debut) {
      return res.status(400).json({ error: 'Le champ date_debut est obligatoire' });
    }

    if (!date_fin) {
      return res.status(400).json({ error: 'Le champ date_fin est obligatoire' });
    }

    if (!animateur_id) {
      return res.status(400).json({ error: 'Le champ animateur_id est obligatoire' });
    }

    // Validation des dates
    const debut = new Date(date_debut);
    const fin = new Date(date_fin);
    if (debut >= fin) {
      return res.status(400).json({
        error: 'La date de fin doit être après la date de début',
      });
    }

    // Vérifier que le projet existe et n'est pas supprimé
    const projet = await Projet.findOne({
      where: { id: projetId, deleted_at: null },
    });

    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Vérifier que l'activité ne dépasse pas les dates du projet
    const projetDebut = projet.date_debut ? new Date(projet.date_debut) : null;
    const projetFin = projet.date_fin ? new Date(projet.date_fin) : null;

    if (!projetDebut || !projetFin || debut < projetDebut || fin > projetFin) {
      return res.status(400).json({
        error: 'Les dates de l\'activité doivent être dans la période du projet',
      });
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

    // Vérifier que le responsable existe et n'est pas supprimé (si fourni)
    if (responsable_id) {
      const responsable = await Animateur.findOne({
        where: { id: responsable_id, deleted_at: null },
      });

      if (!responsable) {
        return res.status(404).json({ error: 'Responsable non trouvé' });
      }

      // Vérifier que le responsable est aussi membre du projet
      const liaisonResponsable = await AnimateurProjet.findOne({
        where: {
          animateur_id: responsable_id,
          projet_id: projetId,
          deleted_at: null,
        },
      });

      if (!liaisonResponsable) {
        return res.status(403).json({
          error: 'Le responsable n\'est pas membre du projet',
        });
      }
    }

    // Créer l'activité
    const activite = await Activite.create({
      projet_id: projetId,
      nom,
      description: description || undefined,
      date_debut: debut,
      date_fin: fin,
      responsable_id: responsable_id || null,
      ordre: ordre || 0,
      created_by: animateur_id,
    });

    return res.status(201).json({
      message: 'Activité créée avec succès',
      activite: {
        id: activite.id,
        projet_id: activite.projet_id,
        nom: activite.nom,
        description: activite.description,
        date_debut: activite.date_debut,
        date_fin: activite.date_fin,
        responsable_id: activite.responsable_id,
        ordre: activite.ordre,
        created_by: activite.created_by,
        created_at: activite.created_at,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la création de l\'activité',
    });
  }
});

/**
 * GET /projets/:projet_id/activites
 * Récupère la liste des activités d'un projet
 * Query params: with (optionnel) - "details" pour inclure les détails complets des créateurs et responsables
 */
router.get('/:projet_id/activites', async (req: Request, res: Response) => {
  try {
    const projetId = Array.isArray(req.params.projet_id) ? req.params.projet_id[0] : req.params.projet_id;
    const withDetails = req.query.with === 'details';

    // Vérifier que le projet existe et n'est pas supprimé
    const projet = await Projet.findOne({
      where: { id: projetId, deleted_at: null },
    });

    if (!projet) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Récupérer les activités non supprimées
    const activites = await Activite.findAll({
      where: {
        projet_id: projetId,
        deleted_at: null,
      },
      order: [['ordre', 'ASC'], ['created_at', 'ASC']],
    });

    // Si with=details, charger les données complètes des créateurs et responsables
    let result: any[] = activites;

    if (withDetails) {
      result = await Promise.all(
        activites.map(async (activite: any) => {
          const createdByAnimateur = await Animateur.findByPk(activite.created_by, {
            attributes: {
              exclude: ['password'],
            },
          });

          const responsableAnimateur = activite.responsable_id
            ? await Animateur.findByPk(activite.responsable_id, {
                attributes: {
                  exclude: ['password'],
                },
              })
            : null;

          const updatedByAnimateur = activite.updated_by
            ? await Animateur.findByPk(activite.updated_by, {
                attributes: {
                  exclude: ['password'],
                },
              })
            : null;

          return {
            id: activite.id,
            projet_id: activite.projet_id,
            nom: activite.nom,
            description: activite.description,
            date_debut: activite.date_debut,
            date_fin: activite.date_fin,
            responsable_id: activite.responsable_id,
            ordre: activite.ordre,
            created_by: activite.created_by,
            updated_by: activite.updated_by,
            created_at: activite.created_at,
            updated_at: activite.updated_at,
            createdByAnimateur: createdByAnimateur && createdByAnimateur.deleted_at === null ? createdByAnimateur : null,
            responsableAnimateur: responsableAnimateur && responsableAnimateur.deleted_at === null ? responsableAnimateur : null,
            updatedByAnimateur: updatedByAnimateur && updatedByAnimateur.deleted_at === null ? updatedByAnimateur : null,
          };
        })
      );
    }

    return res.status(200).json({
      projet_id: projetId,
      count: result.length,
      activites: result,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la récupération des activités',
    });
  }
});

export default router;
