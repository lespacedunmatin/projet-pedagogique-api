import request from 'supertest';
import app from '../src/server';
import Animateur from '../src/models/Animateur';

/**
 * Helper pour établir une session authentifiée
 * @param animateurId - L'UUID de l'animateur
 * @param animateurPassword - Le mot de passe en clair de l'animateur
 * @returns Le cookie de session pour les requêtes authentifiées
 */
export async function getAuthenticatedSession(animateurId: string, animateurPassword: string): Promise<string> {
  const animateur = await Animateur.findByPk(animateurId);
  if (!animateur) throw new Error('Animateur non trouvé');

  const response = await request(app)
    .post('/auth/login')
    .send({
      email: animateur.email,
      password: animateurPassword,
    });

  const setCookie = response.headers['set-cookie'];
  if (!setCookie) throw new Error('Pas de cookie de session');

  return setCookie[0];
}
