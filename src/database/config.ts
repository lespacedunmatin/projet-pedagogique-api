import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'projet_pedagogique',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000, // 60 secondes pour acquérir une connexion
    idle: 30000,    // 30 secondes avant de libérer une connexion idle
  },
  dialectOptions: {
    connectTimeout: 10000, // 10 secondes pour se connecter
  },
});

export default sequelize;
