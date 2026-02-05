import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ObjectifAttributes {
  id: string;
  projet_id: string;
  texte: string;
  ordre?: number;
  created_at?: Date;
  created_by: string;
  updated_at?: Date;
  modified_by?: string | null;
  deleted_at?: Date | null;
  deleted_by?: string | null;
}

interface ObjectifCreationAttributes extends Optional<ObjectifAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'modified_by'> {}

class Objectif extends Model<ObjectifAttributes, ObjectifCreationAttributes> implements ObjectifAttributes {
  declare id: string;
  declare projet_id: string;
  declare texte: string;
  declare ordre?: number;
  declare created_at?: Date;
  declare created_by: string;
  declare updated_at?: Date;
  declare modified_by?: string | null;
  declare deleted_at?: Date | null;
  declare deleted_by?: string | null;
}

Objectif.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projets',
        key: 'id',
      },
    },
    texte: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'animateurs',
        key: 'id',
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'animateurs',
        key: 'id',
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'animateurs',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'objectifs',
    timestamps: true,
    underscored: true,
    paranoid: false, // On gère le soft delete manuellement avec deleted_at
  }
);

export default Objectif;
