import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';
import config from '../../config/config.js';
import { running } from '../runtimes/index.js';
import logger from '../../config/logger.js';

class Link extends Model { }

Link.init({
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
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  gamertags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Gamertags field must be an array!');
        }

        if (!value.every((item) => typeof item === 'string')) {
          throw new Error('Gamertags must contain only strings!');
        }

        if (value.length > 4) {
          throw new Error('Gamertags array must have until 4 elements');
        }

        value.forEach((item) => {
          const gamertagLength = item.length;
          if (gamertagLength < 3 || gamertagLength >= 40) {
            throw new Error(`${item} gamertag must have a length higher than 3 and lower than 40!`);
          }
        });
      },
    },

  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['instance:read'],
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('Permissions field must be an array!');
        }

        if (!value.every((item) => typeof item === 'string')) {
          throw new Error('Permissions must contain only strings!');
        }

        value.forEach((item) => {
          if (!config.instance.permissions.includes(item)) {
            throw new Error(`${item} is an invalid permission!`);
          }
        });
      },
    },
  },
  privileges: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  access: {
    type: DataTypes.STRING,
    values: ['super', 'always', 'monitored'],
    defaultValue: 'always',
    allowNull: false,
  },
}, {
  tableName: 'link',
  sequelize: db,
  timestamps: false,
});

const updateBarrier = async (id) => {
  try {
    if (running[id]) await running[id].newBarrier();
  } catch (err) {
    logger.error({
      err,
      linkId: id,
    }, 'Error to update instance barrier');
  }
};

Link.addHook('afterCreate', async (link) => {
  await updateBarrier(link.instanceId);
});

Link.addHook('afterDestroy', async (link) => {
  await updateBarrier(link.instanceId);
});

Link.addHook('afterUpdate', async (link) => {
  await updateBarrier(link.instanceId);
});

export default Link;
