/* eslint-disable no-console */
import { Sequelize } from 'sequelize';
import config from './config.js';

const databaseConfig = config.database;
let sequelizeConfig;

if (databaseConfig.enable) {
  sequelizeConfig = {
    dialect: 'mysql',
    host: databaseConfig.host,
    username: databaseConfig.username,
    password: databaseConfig.password,
    database: databaseConfig.name,
    logging: false,
  };
} else {
  sequelizeConfig = {
    dialect: 'sqlite',
    storage: './db.sqlite',
    logging: false,
    dialectOptions: {
      foreignKeys: true,
    },
  };
}

const db = new Sequelize(sequelizeConfig);

try {
  await db.authenticate();

  console.log('Connected to Database!');
} catch (err) {
  console.error('Unable to connect to the database: ', err);
}

export default db;
