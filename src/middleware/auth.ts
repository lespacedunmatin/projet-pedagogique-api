import { Request, Response, NextFunction } from 'express';

/**
 * Middleware pour vérifier qu'un utilisateur est authentifié
 * Redirige vers /auth/login ou retourne une erreur 401 selon le type de requête
 */
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (session && session.authenticated && session.userId) {
    return next();
  }

  // Si c'est une requête API (JSON), retourner une erreur 401
  if (req.headers['content-type']?.includes('application/json')) {
    return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
  }

  // Sinon rediriger vers la page de login
  return res.status(401).json({
    error: 'Non authentifié',
    redirect: '/auth/login'
  });
}

/**
 * Middleware pour vérifier qu'un utilisateur n'est pas authentifié
 * Utilisé sur les routes de login/register
 */
function isNotAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (!session || !session.authenticated || !session.userId) {
    return next();
  }

  // L'utilisateur est déjà connecté
  return res.status(400).json({
    error: 'Vous êtes déjà connecté',
    redirect: '/'
  });
}

/**
 * Middleware pour log les informations de session
 * Utile pour le debug
 */
function logSession(req: Request, res: Response, next: NextFunction) {
  if (process.env.DEBUG_SESSION === 'true') {
    const session = req.session as any;
    console.log(`[Session] ${req.method} ${req.path}`, {
      sessionId: req.sessionID,
      authenticated: session?.authenticated,
      userId: session?.userId,
      userName: session?.userName,
    });
  }
  next();
}

/**
 * Middleware pour détruire la session lors de la déconnexion
 */
function destroySession(req: Request, res: Response, next: NextFunction) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Erreur lors de la destruction de la session:', error);
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }

    // Nettoyer le cookie de session
    res.clearCookie('sessionId');
    next();
  });
}

export { isAuthenticated, isNotAuthenticated, logSession, destroySession };
