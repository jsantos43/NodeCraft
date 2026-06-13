'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hytale', {
      instanceId: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'instance',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      servername: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Nodecraft Hytale Server',
      },
      motd: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      maxView: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 32,
      },
      worldname: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'default',
      },
      gamemode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'adventure',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hytale');
  },
};
