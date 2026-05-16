'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('link', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      instanceId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'instance',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true,
      },
      gamertags: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: '[]',
      },
      permissions: {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: '["instance:read"]',
      },
      privileges: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      access: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'always',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('link');
  },
};
