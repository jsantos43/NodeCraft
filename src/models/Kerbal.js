import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Kerbal extends Model { }

Kerbal.init(
  {
    instanceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'instance',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    servername: {
      type: DataTypes.STRING,
      defaultValue: 'Nodecraft KSP Server',
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: 'servername field must have a length between 2 and 32!',
        },
      },
    },
    gamemode: {
      type: DataTypes.STRING,
      values: ['SANDBOX', 'SCIENCE', 'CARRER'],
      allowNull: false,
      defaultValue: 'SANDBOX',
      validate: {
        isIn: {
          args: [['SANDBOX', 'SCIENCE', 'CARRER']],
          msg: 'gamemode field must be SANDBOX, SCIENCE or CARRER!',
        },
      },
    },
    difficulty: {
      type: DataTypes.STRING,
      values: ['EASY', 'NORMAL', 'MODERATE', 'HARD', 'CUSTOM'],
      allowNull: false,
      defaultValue: 'NORMAL',
      validate: {
        isIn: {
          args: [['EASY', 'NORMAL', 'MODERATE', 'HARD', 'CUSTOM']],
          msg: 'difficulty field must be a valid value!',
        },
      },
    },
    warp: {
      type: DataTypes.STRING,
      values: ['MCW_FORCE', 'MCW_VOTE', 'MCW_LOWEST', 'SUBSPACE_SIMPLE', 'SUBSPACE', 'NONE'],
      defaultValue: 'SUBSPACE',
      allowNull: false,
      validate: {
        isIn: {
          args: [['MCW_FORCE', 'MCW_VOTE', 'MCW_LOWEST', 'SUBSPACE_SIMPLE', 'SUBSPACE', 'NONE']],
          msg: 'warp field must be a valid value!',
        },
      },
    },
    allowlist: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cheats: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'kerbal',
    sequelize: db,
    timestamps: false,
  },
);

export default Kerbal;
