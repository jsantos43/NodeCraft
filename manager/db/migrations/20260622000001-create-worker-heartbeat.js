'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('worker_heartbeat', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      workerId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'worker',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      diskAvailable: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('worker_heartbeat', ['workerId', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('worker_heartbeat');
  },
};
