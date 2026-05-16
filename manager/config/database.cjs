require('dotenv').config();

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './db.sqlite',
    logging: false,
    dialectOptions: {
      foreignKeys: true,
    },
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    dialectOptions: {
      foreignKeys: true,
    },
  },
  production: {
    dialect: 'mysql',
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: false,
  },
};
