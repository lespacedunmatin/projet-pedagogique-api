import session from 'express-session';
import sequelize from '../database/config';
import Session from '../models/Session';

/**
 * Configuration des sessions avec Sequelize
 * Stocke les sessions en base de données pour la persistence
 */

// Store personnalisé pour les sessions Sequelize
class SequelizeStore extends session.Store {
  db: any;

  constructor(options: any) {
    super();
    this.db = options.db;
  }

  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      const session = await Session.findByPk(sid);
      if (!session) {
        return callback(null);
      }
      return callback(null, session.data);
    } catch (error) {
      return callback(error);
    }
  }

  async set(sid: string, sessionData: any, callback?: (err?: any) => void) {
    try {
      const expires = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 heures
      await Session.upsert({
        sid,
        data: sessionData,
        expires,
      });
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await Session.destroy({ where: { sid } });
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async clear(callback?: (err?: any) => void) {
    try {
      await Session.destroy({ where: {} });
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
}

const sessionStore = new SequelizeStore({ db: sequelize });

/**
 * Middleware de configuration des sessions
 * - Utilise les cookies pour stocker l'ID de session
 * - Stocke les données de session en base de données
 * - Configure les cookies HttpOnly et secure
 */
const sessionMiddleware = session({
  // Secret pour signer les cookies
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',

  // Ne sauvegarde la session que si elle a été modifiée
  resave: false,

  // Force à sauvegarder une session non initialisée
  saveUninitialized: false,

  // Stockage des sessions en base de données
  store: sessionStore,

  // Configuration du cookie de session
  cookie: {
    // Durée de vie du cookie en millisecondes (24 heures)
    maxAge: 24 * 60 * 60 * 1000,

    // Empêche l'accès au cookie depuis JavaScript (XSS protection)
    httpOnly: true,

    // N'envoie le cookie que sur HTTPS en production
    secure: process.env.NODE_ENV === 'production',

    // SameSite pour CSRF protection
    sameSite: 'strict' as const,
  },

  // Nom du cookie de session
  name: 'sessionId',
});

/**
 * Initialise la table de sessions en base de données
 * À appeler au démarrage de l'application
 */
async function initializeSessionStore() {
  try {
    await Session.sync();
    console.log('✓ Table sessions créée/synchronisée');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la table sessions:', error);
    throw error;
  }
}

export { sessionMiddleware, sessionStore, initializeSessionStore };
