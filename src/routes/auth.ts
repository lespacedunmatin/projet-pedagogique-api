import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Animateur from '../models/Animateur';
import { isNotAuthenticated } from '../middleware/auth';

const router = express.Router();

/**
 * POST /auth/register
 * Crée un nouvel animateur et établit une session
 * Body: {
 *   email: string (adresse email unique),
 *   password: string (mot de passe, min 8 caractères),
 *   confirmPassword: string (confirmation du mot de passe),
 *   nom: string (nom de l'animateur)
 * }
 */
router.post('/register', isNotAuthenticated, async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, nom } = req.body;

    // Validation des paramètres obligatoires
    if (!email) {
      return res.status(400).json({ error: 'L\'email est obligatoire' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Le mot de passe est obligatoire' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ error: 'La confirmation du mot de passe est obligatoire' });
    }

    if (!nom) {
      return res.status(400).json({ error: 'Le nom est obligatoire' });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }

    // Validation de la longueur du mot de passe
    if (password.length < 12) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 12 caractères',
      });
    }

    // Vérification que les mots de passe correspondent
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Les mots de passe ne correspondent pas',
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingAnimateur = await Animateur.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingAnimateur) {
      return res.status(409).json({
        error: 'Cet email est déjà utilisé',
      });
    }

    // Valider la force du mot de passe
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Le mot de passe ne respecte pas les critères de sécurité',
        requirements: passwordValidation.requirements,
      });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'animateur
    const animateur = await Animateur.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      nom: nom.trim(),
    });

    // Établir la session
    (req.session as any).userId = animateur.id;
    (req.session as any).userEmail = animateur.email;
    (req.session as any).userName = animateur.nom;
    (req.session as any).authenticated = true;

    // Sauvegarder la session
    req.session.save((error: any) => {
      if (error) {
        console.error('Erreur lors de la sauvegarde de la session:', error);
        return res.status(500).json({ error: 'Erreur lors de la création de la session' });
      }

      return res.status(201).json({
        message: 'Inscription réussie',
        animateur: {
          id: animateur.id,
          email: animateur.email,
          nom: animateur.nom,
          created_at: animateur.created_at,
        },
      });
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de l\'inscription',
    });
  }
});

/**
 * Valide la force d'un mot de passe
 * Critères:
 * - Au moins 12 caractères
 * - Au moins une lettre majuscule
 * - Au moins une lettre minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial (!@#$%^&*)
 */
function validatePasswordStrength(password: string): {
  isValid: boolean;
  requirements: Record<string, boolean>;
} {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid = Object.values(requirements).every((requirement) => requirement);

  return { isValid, requirements };
}

export default router;
