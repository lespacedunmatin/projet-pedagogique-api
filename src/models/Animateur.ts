import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface AnimateurAttributes {
  id: string;
  email: string;
  password: string;
  nom: string;
  bio?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface AnimateurCreationAttributes extends Optional<AnimateurAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Animateur extends Model<AnimateurAttributes, AnimateurCreationAttributes> implements AnimateurAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare nom: string;
  declare bio?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare deleted_at?: Date | null;
}

Animateur.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Animateur',
    tableName: 'animateurs',
    timestamps: false,
  }
);

export default Animateur;
