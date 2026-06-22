'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isSqlite = queryInterface.sequelize.getDialect() === 'sqlite';

    // SQLite can't ALTER a column type, so Sequelize rebuilds the whole table.
    // FK enforcement would fail that rebuild because `instance` references `worker`.
    if (isSqlite) await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    try {
      await queryInterface.changeColumn('worker', 'lastSeenAt', {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
      });
    } finally {
      if (isSqlite) await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }
  },

  async down(queryInterface, Sequelize) {
    const isSqlite = queryInterface.sequelize.getDialect() === 'sqlite';

    if (isSqlite) await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    try {
      await queryInterface.changeColumn('worker', 'lastSeenAt', {
        type: Sequelize.DataTypes.TIME,
        allowNull: true,
      });
    } finally {
      if (isSqlite) await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }
  },
};
