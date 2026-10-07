import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';
import { isStringArray } from './validators.js';
import config from '../../config/config.js';

class Instance extends Model { }

Instance.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'worker',
      key: 'id',
    },
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id',
    },
    validate: {
      isUUID: {
        args: 4,
        msg: 'ownerId field must be a user id!',
      },
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'name field cannot be empty!',
      },
      is: {
        args: /^[a-zA-ZÀ-ÿ0-9\s]+$/i,
        msg: 'name field must be valid!',
      },
      len: {
        args: [3, 32],
        msg: 'name field must have a length between 3 and 32!',
      },
    },
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'minecraft',
    allowNull: false,
    validate: {
      isIn: {
        args: [config.instance.games],
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
  diskUsage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'diskUsage field must be greater than or equal to 0!',
      },
    },
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'stopped',
    allowNull: false,
    validate: {
      isIn: {
        args: [['starting', 'running', 'stopped', 'failed']],
        msg: 'status field must have a valid value!',
      },
    },
  },
  history: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidArray: isStringArray('History'),
    },
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastBackupAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // When the scheduler last asked a worker to back this instance up. Stamped at
  // request time, unlike lastBackupAt, which waits for the worker to report.
  backupRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastBackupStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: {
        args: [['success', 'failed', 'skipped']],
        msg: 'lastBackupStatus must be success, failed or skipped!',
      },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'instance',
  sequelize: db,
  timestamps: true,
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['workerId', 'port'], name: 'instance_worker_id_port_unique' },
  ],
  hooks: {
    beforeSave(instance) {
      const history = instance.get('history');
      if (!Array.isArray(history) || history.length <= config.instance.maxHistory) return;

      instance.set('history', history.slice(history.length - config.instance.maxHistory));
    },
  },
});

export default Instance;
