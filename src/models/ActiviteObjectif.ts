import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface ActiviteObjectifAttributes {
  id: string;
  activite_id: string;
  objectif_id: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface ActiviteObjectifCreationAttributes extends Optional<ActiviteObjectifAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class ActiviteObjectif extends Model<ActiviteObjectifAttributes, ActiviteObjectifCreationAttributes> implements ActiviteObjectifAttributes {
  declare id: string;
  declare activite_id: string;
  declare objectif_id: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare deleted_at?: Date | null;
}

ActiviteObjectif.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activite_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'activites',
        key: 'id',
      },
    },
    objectif_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'objectifs',
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
  },
  {
    sequelize,
    tableName: 'activite_objectif',
    timestamps: true,
    underscored: true,
    paranoid: false, // On gère le soft delete manuellement avec deleted_at
    indexes: [
      {
        unique: true,
        fields: ['activite_id', 'objectif_id'],
      },
    ],
  }
);

export default ActiviteObjectif;
