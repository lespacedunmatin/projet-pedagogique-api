import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ActiviteAttributes {
  id: string;
  projet_id: string;
  nom: string;
  description?: string;
  date_debut: Date;
  date_fin: Date;
  responsable_id?: string | null;
  ordre?: number;
  created_at?: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string | null;
  deleted_at?: Date | null;
  deleted_by?: string | null;
}

interface ActiviteCreationAttributes extends Optional<ActiviteAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'updated_by'> {}

class Activite extends Model<ActiviteAttributes, ActiviteCreationAttributes> implements ActiviteAttributes {
  declare id: string;
  declare projet_id: string;
  declare nom: string;
  declare description?: string;
  declare date_debut: Date;
  declare date_fin: Date;
  declare responsable_id?: string | null;
  declare ordre?: number;
  declare created_at?: Date;
  declare created_by: string;
  declare updated_at?: Date;
  declare updated_by?: string | null;
  declare deleted_at?: Date | null;
  declare deleted_by?: string | null;
}

Activite.init(
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
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    responsable_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'animateurs',
        key: 'id',
      },
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'animateurs',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'animateurs',
        key: 'id',
      },
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
    tableName: 'activites',
    timestamps: true,
    underscored: true,
    paranoid: false, // On gère le soft delete manuellement avec deleted_at
  }
);

export default Activite;
