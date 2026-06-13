'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('counterstrike', {
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
      steamToken: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      servername: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'A Nodecraft Counter Strike 2 server',
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      rconPassword: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'nodecraft',
      },
      mode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'casual',
      },
      map: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'dust2',
      },
      botDifficulty: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      botQuota: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      botMode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'fill',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('counterstrike');
  },
};
