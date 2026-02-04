import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Animateur from '../models/Animateur';
import AnimateurProjet from '../models/AnimateurProjet';
import Projet from '../models/Projet';

const router = express.Router();

/**
 * POST /animateurs
 * Crée un nouvel animateur en base de données
 * Body: { email: string, password: string, nom: string, bio?: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, nom, bio } = req.body;

    // Validation des champs obligatoires
    if (!email || !password || !nom) {
      return res.status(400).json({
        error: 'Les champs email, password et nom sont obligatoires',
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingAnimateur = await Animateur.findOne({ where: { email } });

    if (existingAnimateur) {
      return res.status(409).json({
        error: 'Un animateur avec cet email existe déjà',
      });
    }

    // TODO : vérifier que le mot de passe est suffisamment fort

    // Chiffrer le mot de passe avec bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel animateur
    const newAnimateur = await Animateur.create({
      email,
      password: hashedPassword,
      nom,
      bio: bio || undefined,
    });

    // Retourner l'animateur créé (sans le mot de passe)
    const animateurResponse = newAnimateur.toJSON();

    // Supprimer le champ password de la réponse
    delete (animateurResponse as any).password;

    return res.status(201).json({
      message: 'Animateur créé avec succès',
      animateur: animateurResponse,
    });
  } catch (error) {
    console.error('Erreur lors de la création de l’animateur:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création de l’animateur',
    });
  }
});

/**
 * GET /animateurs
 * Récupère la liste des animateurs
 * Query params: id_projet (optionnel) - Filtre les animateurs associés à un projet
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { id_projet } = req.query;

    // Si id_projet n'est pas fourni, récupérer tous les animateurs
    if (!id_projet) {
      const animateurs = await Animateur.findAll({
        where: {
          deleted_at: null, // Exclure les animateurs supprimés (soft delete)
        },
        attributes: {
          exclude: ['password'], // Ne pas retourner le mot de passe
        },
      });

      return res.status(200).json({
        count: animateurs.length,
        animateurs,
      });
    }

    // TODO : Implémenter le filtrage par id_projet une fois le modèle AnimateurProjet créé
    // Pour l'instant, retourner une erreur explicite
    return res.status(501).json({
      error: 'Le filtrage par id_projet n\'est pas encore implémenté',
      message: 'Créez d\'abord les associations AnimateurProjet',
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des animateurs:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération des animateurs',
    });
  }
});

/**
 * GET /animateurs/:id
 * Récupère un animateur spécifique par son ID
 * Query params: with (optionnel) - "projets" pour inclure la liste des projets
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const withProjets = req.query.with === 'projets';

    const animateur = await Animateur.findByPk(id, {
      attributes: {
        exclude: ['password'], // Ne pas retourner le mot de passe
      },
    });

    // Vérifier que l'animateur existe et n'est pas supprimé
    if (!animateur) {
      return res.status(404).json({
        error: 'Animateur non trouvé',
      });
    }

    // Vérifier que l'animateur existe et n'est pas supprimé
    if (animateur && animateur.deleted_at !== null) {
      return res.status(410).json({
        error: 'Animateur supprimé',
      });
    }

    // Si with=projets, récupérer les projets de l'animateur
    if (withProjets) {
      const liaisons = await AnimateurProjet.findAll({
        where: {
          animateur_id: id,
          deleted_at: null, // Exclure les liaisons supprimées
        },
      });

      const projets = await Promise.all(
        liaisons.map(async (liaison: any) => {
          const projet = await Projet.findByPk(liaison.projet_id);

          return {
            projet,
            liaison_id: liaison.id,
            role: liaison.role,
            created_at: liaison.created_at,
          };
        })
      );

      // Filtrer les projets supprimés (soft delete)
      const activeProjectAssignments = projets.filter(
        (p: any) => p.projet !== null && p.projet.deleted_at === null
      );

      return res.status(200).json({
        animateur,
        projets: activeProjectAssignments,
      });
    }

    return res.status(200).json({
      animateur,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'animateur:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération de l\'animateur',
    });
  }
});

/**
 * DELETE /animateurs/:id
 * Effectue un soft delete en renseignant le champ deleted_at
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Vérifier que l'animateur existe
    const animateur = await Animateur.findByPk(id);

    if (!animateur) {
      return res.status(404).json({
        error: 'Animateur non trouvé',
      });
    }

    // Vérifier que l'animateur n'est pas déjà supprimé
    if (animateur.deleted_at !== null) {
      return res.status(410).json({
        error: 'Cet animateur a déjà été supprimé',
      });
    }

    // Effectuer le soft delete en mettant à jour deleted_at
    const now = new Date();
    await animateur.update({ deleted_at: now });

    return res.status(200).json({
      message: 'Animateur supprimé avec succès',
      animateur: {
        id: animateur.id,
        email: animateur.email,
        nom: animateur.nom,
        deleted_at: now,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'animateur:', error);
    return res.status(500).json({
      error: 'Erreur lors de la suppression de l\'animateur',
    });
  }
});

export default router;
