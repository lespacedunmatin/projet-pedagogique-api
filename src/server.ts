import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupAssociations } from './database/associations';
import animateursRouter from './routes/animateurs';
import projetsRouter from './routes/projets';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurer les associations Sequelize
setupAssociations();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/status', (req, res) => {
  res.json({ message: 'le serveur fonctionne' });
});

// Routes animateurs
app.use('/animateurs', animateursRouter);

// Routes projets
app.use('/projets', projetsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
