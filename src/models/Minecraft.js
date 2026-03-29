import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Minecraft extends Model { }

Minecraft.init(
  {
    instanceId: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'instance',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    software: {
      type: DataTypes.STRING,
      values: ['vanilla', 'paper', 'purpur'],
      defaultValue: 'vanilla',
      allowNull: false,
      validate: {
        isIn: {
          args: [['vanilla', 'paper', 'purpur']],
          msg: 'software field must be vanilla, paper or purpur!',
        },
      },
    },
    bedrock: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    gamemode: {
      type: DataTypes.STRING,
      values: ['survival', 'creative', 'adventure'],
      allowNull: false,
      defaultValue: 'survival',
      validate: {
        isIn: {
          args: [['survival', 'creative', 'adventure']],
          msg: 'gamemode field must be survival, creative or adventure!',
        },
      },
    },
    difficulty: {
      type: DataTypes.STRING,
      values: ['peaceful', 'easy', 'normal', 'hard'],
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: {
          args: [['peaceful', 'easy', 'normal', 'hard']],
          msg: 'difficulty field must be peaceful, easy, normal or hard!',
        },
      },
    },
    seed: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
      validate: {
        len: {
          args: [0, 50],
          msg: 'seed field must have a length between 0 and 32!',
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
    levelType: {
      type: DataTypes.STRING,
      defaultValue: 'minecraft:normal',
      values: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified'],
      allowNull: false,
      validate: {
        isIn: {
          args: [['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified']],
          msg: 'levelType field must be minecraft:normal, minecraft:flat, minecraft:large_biomes or minecraft:amplified!',
        },
      },
    },
    viewDistance: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
      validate: {
        min: {
          args: [3],
          msg: 'viewDistance field must be greater than or equal to 3!',
        },
        max: {
          args: [32],
          msg: 'viewDistance field must be lower than or equal to 32!',
        },
      },
    },
    spawn: {
      type: DataTypes.INTEGER,
      defaultValue: 16,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'spawn field must be greater than or equal to 0!',
        },
        max: {
          args: [32],
          msg: 'spawn field must be lower than or equal to 32!',
        },
      },
    },
    idle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'idle field must be greater than or equal to -1!',
        },
        max: {
          args: [1440],
          msg: 'idle field must be lower than or equal to 1440!',
        },
      },
    },
    commandBlock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pvp: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    licensed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowlist: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    nether: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    secureProfile: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    forceGamemode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    hardcore: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    animals: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    monsters: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    npcs: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cheats: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'minecraft',
    sequelize: db,
    timestamps: false,
  },
);

export default Minecraft;
