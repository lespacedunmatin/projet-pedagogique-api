import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

// Middleware de sécurité
app.use(helmet());

// Middleware de log
app.use(morgan('dev'));

// Configuration CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:4200'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,  // ✅ Autoriser les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24h
}));

// Parsing des données
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
