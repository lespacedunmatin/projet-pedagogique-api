import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import animateursRouter from './routes/animateurs';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
