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
  birthDate: {
    type: DataTypes.DATE,
    allowNull: true,
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
