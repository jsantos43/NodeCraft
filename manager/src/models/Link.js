import { Sequelize, DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';
import config from '../../config/config.js';

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
    allowNull: false,
    references: {
      model: 'user',
      key: 'id',
    },
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
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
}, {
  tableName: 'link',
  sequelize: db,
  timestamps: false,
});

export default Link;
