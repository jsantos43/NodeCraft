'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worker', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      apiKey: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      healthy: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastSeenAt: {
        type: Sequelize.DataTypes.TIME,
        allowNull: true,
      },
      cpuUsage: {
        type: Sequelize.DataTypes.DOUBLE,
        allowNull: true,
      },
      memorieTotal: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      memorieUsed: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      diskTotal: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      diskUsed: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('worker');
  },
};
