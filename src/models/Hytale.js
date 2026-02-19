import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Hytale extends Model { }

Hytale.init(
  {
    servername: {
      type: DataTypes.STRING,
      defaultValue: 'Nodecraft Hytale Server',
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: 'servername field must have a length between 3 and 32!',
        },
      },
    },
    motd: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
      validate: {
        len: {
          args: [0, 50],
          msg: 'motd field must have a length between 0 and 50!',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        len: {
          args: [0, 32],
          msg: 'password field must have a length between 2 and 32!',
        },
      },
    },
    maxView: {
      type: DataTypes.INTEGER,
      defaultValue: 32,
      allowNull: false,
      validate: {
        min: {
          args: [3],
          msg: 'maxView field must be greater than or equal to 3!',
        },
        max: {
          args: [100],
          msg: 'maxView field must be lower than or equal to 100!',
        },
      },
    },
    worldname: {
      type: DataTypes.STRING,
      defaultValue: 'default',
      allowNull: false,
      validate: {
        len: {
          args: [3, 32],
          msg: 'worldname field must have a length between 2 and 32!',
        },
      },
    },
    gamemode: {
      type: DataTypes.STRING,
      values: ['adventure', 'creative'],
      allowNull: false,
      defaultValue: 'adventure',
      validate: {
        isIn: {
          args: [['adventure', 'creative']],
          msg: 'gamemode field must be adventure or creative!',
        },
      },
    },
  },
  {
    tableName: 'hytale',
    sequelize: db,
    timestamps: false,
  },
);

export default Hytale;
