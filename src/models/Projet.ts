import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ProjetAttributes {
  id: string;
  nom: string;
  description?: string;
  date_debut?: Date;
  date_fin?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface ProjetCreationAttributes extends Optional<ProjetAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Projet extends Model<ProjetAttributes, ProjetCreationAttributes> implements ProjetAttributes {
  declare id: string;
  declare nom: string;
  declare description?: string;
  declare date_debut?: Date;
  declare date_fin?: Date;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare deleted_at?: Date | null;
}

Projet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_fin: {
      type: DataTypes.DATE,
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
    modelName: 'Projet',
    tableName: 'projets',
    timestamps: false,
  }
);

export default Projet;
