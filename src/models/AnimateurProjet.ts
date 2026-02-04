import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface AnimateurProjetAttributes {
  id: string;
  animateur_id: string;
  projet_id: string;
  role?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface AnimateurProjetCreationAttributes extends Optional<AnimateurProjetAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class AnimateurProjet extends Model<AnimateurProjetAttributes, AnimateurProjetCreationAttributes> implements AnimateurProjetAttributes {
  declare id: string;
  declare animateur_id: string;
  declare projet_id: string;
  declare role?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
  declare deleted_at?: Date | null;
}

AnimateurProjet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    animateur_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'animateurs',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    projet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projets',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Role de l\'animateur dans le projet (ex: coordinateur, assistant)',
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
    modelName: 'AnimateurProjet',
    tableName: 'animateur_projet',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['animateur_id', 'projet_id'],
        name: 'unique_animateur_projet',
      },
    ],
  }
);

export default AnimateurProjet;
