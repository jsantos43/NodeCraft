import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

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
        msg: 'email is already registered!',
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
    defaultValue: ['minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal'],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('allowedGames field must be an array!');
        }

        if (!value.every((item) => typeof item === 'string')) {
          throw new Error('allowedGames must contain only strings!');
        }
      },
    },
  },
  allowedWorkers: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('allowedWorkers field must be an array!');
        }

        if (!value.every((item) => typeof item === 'string')) {
          throw new Error('allowedWorkers must contain only strings!');
        }
      },
    },
  },
}, {
  tableName: 'user',
  sequelize: db,
  timestamps: false,
  defaultScope: {
    attributes: {
      exclude: [
        'password',
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
