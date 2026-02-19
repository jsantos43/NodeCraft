import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Kerbal extends Model { }

Kerbal.init(
  {
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
      values: ['sandbox', 'science', 'carrer'],
      allowNull: false,
      defaultValue: 'sandbox',
      validate: {
        isIn: {
          args: [['sandbox', 'science', 'carrer']],
          msg: 'gamemode field must be sandbox, science or carrer!',
        },
      },
    },
    difficulty: {
      type: DataTypes.STRING,
      values: ['easy', 'normal', 'moderate', 'hard', 'custom'],
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: {
          args: [['easy', 'normal', 'moderate', 'hard', 'custom']],
          msg: 'difficulty field must be a valid value!',
        },
      },
    },
    warp: {
      type: DataTypes.STRING,
      values: ['mcw_force', 'mcw_vote', 'mcw_lowest', 'subspace_simple', 'subspace', 'none'],
      defaultValue: 'subspace',
      allowNull: false,
      validate: {
        isIn: {
          args: [['mcw_force', 'mcw_vote', 'mcw_lowest', 'subspace_simple', 'subspace', 'none']],
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
