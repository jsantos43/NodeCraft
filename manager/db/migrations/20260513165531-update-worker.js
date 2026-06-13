'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('worker', 'secret', {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      }, { transaction: t });
      await queryInterface.addColumn('worker', 'diskUsage', {
        type: Sequelize.DataTypes.DOUBLE,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.removeColumn('worker', 'diskTotal', { transaction: t });
      await queryInterface.removeColumn('worker', 'diskUsed', { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('worker', 'secret', { transaction: t });
      await queryInterface.removeColumn('worker', 'diskUsage', { transaction: t });
      await queryInterface.addColumn('worker', 'diskTotal', {
        type: Sequelize.DataTypes.INTEGER,
      }, { transaction: t });
      await queryInterface.addColumn('worker', 'diskUsed', {
        type: Sequelize.DataTypes.INTEGER,
      }, { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
