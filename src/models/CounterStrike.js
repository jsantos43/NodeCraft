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
  maxPlayers: {
    type: DataTypes.NUMBER,
    defaultValue: 10,
    allowNull: false,
    validate: {
      min: {
        args: [2],
        msg: 'maxPlayers field must be greater than or equal to 2!',
      },
      max: {
        args: [20],
        msg: 'maxPlayers field must be lower than or equal to 20!',
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
  botDifficulty: {
    type: DataTypes.NUMBER,
    defaultValue: 1,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'botDifficulty field must be greater than or equal to 0!',
      },
      max: {
        args: [3],
        msg: 'botDifficulty field must be lower than or equal to 3!',
      },
    },
  },
  botQuota: {
    type: DataTypes.NUMBER,
    defaultValue: 10,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'botQuota field must be greater than or equal to 0!',
      },
      max: {
        args: [20],
        msg: 'botQuota field must be lower than or equal to 20!',
      },
    },
  },
  botMode: {
    type: DataTypes.STRING,
    defaultValue: 'fill',
    values: ['fill', 'normal'],
    allowNull: false,
    validate: {
      isIn: {
        args: [['fill', 'normal']],
        msg: 'botMode field must be fill or normal!',
      },
    },
  },
}, {
  tableName: 'counterstrike',
  sequelize: db,
  timestamps: false,
});

export default CounterStrike;
