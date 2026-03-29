import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Instance extends Model { }

Instance.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  owner: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id',
    },
    validate: {
      isUUID: {
        args: 4,
        msg: 'owner field must be a user id!',
      },
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[a-zA-ZÀ-ÿ0-9\s]+$/i,
        msg: 'name field must be valid!',
      },
      len: {
        args: [3, 32],
        msg: 'name field must have a length between 2 and 32!',
      },
    },
  },
  type: {
    type: DataTypes.STRING,
    values: ['minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal'],
    defaultValue: 'minecraft',
    allowNull: false,
    validate: {
      isIn: {
        args: [['minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal']],
        msg: 'type field must be a supported game!',
      },
    },
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  memory: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1024,
    validate: {
      min: {
        args: [512],
        msg: 'memory field must be greater than or equal to 512mb!',
      },
    },
  },
  cpu: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: {
        args: [1],
        msg: 'cpu field must be greater than or equal to 1!',
      },
    },
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'maxPlayers field must be greater than or equal to 1!',
      },
      max: {
        args: [1000],
        msg: 'maxPlayers field must be lower than or equal to 1000!',
      },
    },
  },
  status: {
    type: DataTypes.STRING,
    values: ['running', 'stopped', 'failed'],
    defaultValue: 'stopped',
    allowNull: false,
    validate: {
      isIn: {
        args: [['running', 'stopped', 'failed']],
        msg: 'status field must have a valid value!',
      },
    },
  },
  history: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('History field must be an array!');
        }

        if (!value.every((item) => typeof item === 'string')) {
          throw new Error('History must contain only strings!');
        }
      },
    },
  },
}, {
  tableName: 'instance',
  sequelize: db,
  timestamps: false,
});

export default Instance;
