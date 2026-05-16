'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kerbal', {
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
        defaultValue: 'Nodecraft KSP Server',
      },
      gamemode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'SANDBOX',
      },
      difficulty: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NORMAL',
      },
      warp: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'SUBSPACE',
      },
      allowlist: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      cheats: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('kerbal');
  },
};
