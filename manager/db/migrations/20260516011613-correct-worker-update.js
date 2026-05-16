/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('worker', 'diskAvailable', {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
      }, { transaction: t });
      await queryInterface.removeColumn('worker', 'diskUsage', { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('worker', 'diskAvailable', { transaction: t });
      await queryInterface.addColumn('worker', 'diskUsage', {
        type: Sequelize.DataTypes.DOUBLE,
      }, { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
