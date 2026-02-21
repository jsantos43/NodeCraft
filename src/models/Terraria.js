import { DataTypes, Model } from 'sequelize';
import db from '../../config/sequelize.js';

class Terraria extends Model { }

Terraria.init(
  {
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'difficulty field must be 0(normal), 1(expert), 2(master), or 3(journey)',
        },
        max: {
          args: [3],
          msg: 'difficulty field must be 0(normal), 1(expert), 2(master), or 3(journey)',
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
  },
  {
    tableName: 'terraria',
    sequelize: db,
    timestamps: false,
  },
);

export default Terraria;
