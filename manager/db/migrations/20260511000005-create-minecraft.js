'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('minecraft', {
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
      software: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'vanilla',
      },
      bedrock: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      gamemode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'survival',
      },
      difficulty: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'normal',
      },
      seed: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      motd: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      levelType: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'minecraft:normal',
      },
      viewDistance: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      spawn: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 16,
      },
      idle: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      commandBlock: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pvp: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      licensed: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allowlist: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      nether: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      secureProfile: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      forceGamemode: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hardcore: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      animals: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      monsters: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      npcs: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      cheats: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('minecraft');
  },
};
