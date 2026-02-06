import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

interface SessionAttributes {
  sid: string;
  expires?: Date | null;
  data: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'createdAt' | 'updatedAt'> {}

class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  declare sid: string;
  declare expires?: Date | null;
  declare data: Record<string, any>;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

Session.init(
  {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    tableName: 'sessions',
    timestamps: true,
    underscored: true,
  }
);

export default Session;
