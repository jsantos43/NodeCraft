import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';
import config from '../../config/config.js';

class Roster extends Model { }

Roster.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  instanceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'instance',
      key: 'id',
    },
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 64],
        msg: 'identifier field must have a length between 1 and 64!',
      },
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 50],
        msg: 'name field must have a length between 1 and 50!',
      },
    },
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'java',
    validate: {
      isIn: {
        args: [config.roster.platforms],
        msg: `platform field must be ${config.roster.platforms.join(', ')}!`,
      },
    },
  },
  access: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'member',
    validate: {
      isIn: {
        args: [config.roster.access],
        msg: `access field must be ${config.roster.access.join(', ')}!`,
      },
    },
  },
  privileged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'roster',
  sequelize: db,
  timestamps: false,
  indexes: [
    { unique: true, fields: ['instanceId', 'platform', 'identifier'] },
  ],
});

export default Roster;
