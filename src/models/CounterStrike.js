import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class CounterStrike extends Model { }

CounterStrike.init({
  steamToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hostname: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'A Nodecraft CS:GO server',
    validate: {
      len: {
        args: [3, 32],
        msg: 'hostname field must have a length between 2 and 32!',
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
  rconPassword: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'nodecraft',
    validate: {
      is: {
        args: /^[a-zA-ZÀ-ÿ0-9\s]+$/i,
        msg: 'rconPassword field must be valid!',
      },
      len: {
        args: [3, 32],
        msg: 'rconPassword field must have a length between 2 and 32!',
      },
    },
  },
  map: {
    type: DataTypes.STRING,
    values: [
      'mirage',
      'dust2',
      'inferno',
      'nuke',
      'overpass',
      'vertigo',
      'ancient',
      'anubis',
      'officie',
      'italy',
      'lake',
      'thistle',
      'assembly',
      'memento',
    ],
    defaultValue: 'dust2',
    allowNull: false,
    validate: {
      isIn: {
        args: [[
          'mirage',
          'dust2',
          'inferno',
          'nuke',
          'overpass',
          'vertigo',
          'ancient',
          'anubis',
          'officie',
          'italy',
          'lake',
          'thistle',
          'assembly',
          'memento',
        ]],
        msg: 'map field must be a valid value!',
      },
    },
  },
  mode: {
    type: DataTypes.STRING,
    values: ['casual', 'competitive', 'wingman', 'deathmatch'],
    defaultValue: 'casual',
    allowNull: false,
    validate: {
      isIn: {
        args: [['casual', 'competitive', 'wingman', 'deathmatch']],
        msg: 'mode field must be a valid value!',
      },
    },
  },
}, {
  tableName: 'counterstrike',
  sequelize: db,
  timestamps: false,
});

export default CounterStrike;
