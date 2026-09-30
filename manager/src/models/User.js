import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';
import { isStringArray } from './validators.js';
import config from '../../config/config.js';

class User extends Model { }

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[a-zA-ZÀ-ÿ0-9\s]+$/i,
        msg: 'name must be valid!',
      },
      len: {
        args: [2, 32],
        msg: 'name must have a length between 2 and 32!',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'email field must be correct!',
      },
      len: {
        args: [1, 257],
        msg: 'email must have a length between 1 and 257!',
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sessionVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  emailTokenHash: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emailTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetPasswordTokenHash: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resetPasswordTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refreshTokenHash: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  refreshTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  maxInstances: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'maxInstances field must be greater than or equal to 0!',
      },
    },
  },
  maxMemory: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'maxMemory field must be greater than or equal to 0!',
      },
    },
  },
  maxCpu: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'maxCpu field must be greater than or equal to 0!',
      },
    },
  },
  maxDisk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5120,
    validate: {
      min: {
        args: [0],
        msg: 'maxDisk field must be greater than or equal to 0!',
      },
    },
  },
  allowedGames: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [...config.instance.games],
    validate: {
      isValidArray: isStringArray('allowedGames'),
    },
  },
  allowedWorkers: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidArray: isStringArray('allowedWorkers'),
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'user',
  sequelize: db,
  timestamps: true,
  updatedAt: false,
  defaultScope: {
    attributes: {
      exclude: [
        'password',
        'sessionVersion',
        'emailTokenHash',
        'emailTokenExpires',
        'resetPasswordTokenHash',
        'resetPasswordTokenExpires',
        'refreshTokenHash',
        'refreshTokenExpires',
      ],
    },
  },
});

export default User;
