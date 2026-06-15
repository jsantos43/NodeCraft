'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('worker', 'lastSeenAt', {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('worker', 'lastSeenAt', {
      type: Sequelize.DataTypes.TIME,
      allowNull: true,
    });
  },
};
