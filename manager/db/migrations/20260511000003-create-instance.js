'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instance', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      owner: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'minecraft',
      },
      port: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      memory: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1024,
      },
      cpu: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      maxPlayers: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      status: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'stopped',
      },
      history: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: '[]',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('instance');
  },
};
