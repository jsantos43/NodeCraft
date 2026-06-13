'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('terraria', {
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
      difficulty: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
      motd: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('terraria');
  },
};
