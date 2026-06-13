'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('instance', 'lastBackupAt', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('instance', 'lastBackupStatus', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instance', 'lastBackupAt');
    await queryInterface.removeColumn('instance', 'lastBackupStatus');
  },
};
