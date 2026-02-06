import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupAssociations } from './database/associations';
import { sessionMiddleware, initializeSessionStore } from './config/session';
import animateursRouter from './routes/animateurs';
import authRouter from './routes/auth';
import projetsRouter from './routes/projets';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser les sessions au démarrage
initializeSessionStore().catch((error) => {
  console.error('Erreur lors de l\'initialisation des sessions:', error);
  process.exit(1);
});

// Configurer les associations Sequelize
setupAssociations();

// Middleware de sécurité et parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route status accessible sans session
app.get('/status', (req, res) => {
  res.json({ message: 'le serveur fonctionne' });
});

// Middleware de sessions (après les routes publiques)
app.use(sessionMiddleware);

// Routes d'authentification
app.use('/auth', authRouter);

// Routes animateurs
app.use('/animateurs', animateursRouter);

// Routes projets
app.use('/projets', projetsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
