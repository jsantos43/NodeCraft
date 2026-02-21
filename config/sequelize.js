/* eslint-disable no-console */
import { Sequelize } from 'sequelize';

const db = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
  logging: false,
});

try {
  await db.authenticate();

  console.log('Connected to Database!');
} catch (err) {
  console.error('Unable to connect to the database: ', err);
}

export default db;
