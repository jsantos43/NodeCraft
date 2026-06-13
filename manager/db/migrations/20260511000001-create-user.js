'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      id: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      admin: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      verified: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailTokenHash: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      emailTokenExpires: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
      resetPasswordTokenHash: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      resetPasswordTokenExpires: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
      refreshTokenHash: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      refreshTokenExpires: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user');
  },
};
