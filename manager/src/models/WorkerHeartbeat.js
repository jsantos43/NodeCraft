import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class WorkerHeartbeat extends Model { }

WorkerHeartbeat.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'worker',
      key: 'id',
    },
  },
  cpuUsage: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  memorieTotal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  memorieUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  diskAvailable: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'worker_heartbeat',
  sequelize: db,
  timestamps: false,
  indexes: [
    { fields: ['workerId', 'createdAt'] },
  ],
});

export default WorkerHeartbeat;
