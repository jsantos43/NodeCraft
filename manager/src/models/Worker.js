import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Worker extends Model { }

Worker.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
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
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  healthy: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  lastSeenAt: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  cpuUsage: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  memorieTotal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [512],
        msg: 'memory field must be greater than or equal to 512mb!',
      },
    },
  },
  memorieUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [512],
        msg: 'memory field must be greater than or equal to 512mb!',
      },
    },
  },
  diskTotal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [512],
        msg: 'memory field must be greater than or equal to 512mb!',
      },
    },
  },
  diskUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [512],
        msg: 'memory field must be greater than or equal to 512mb!',
      },
    },
  },
}, {
  tableName: 'worker',
  sequelize: db,
  timestamps: false,
});

export default Worker;
