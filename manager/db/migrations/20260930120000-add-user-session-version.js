module.exports = {
  async up(queryInterface, Sequelize) {
    const description = await queryInterface.describeTable('user');
    if (description.sessionVersion) return;

    await queryInterface.addColumn('user', 'sessionVersion', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    const description = await queryInterface.describeTable('user');
    if (!description.sessionVersion) return;

    // Avoid rebuilding a referenced table on SQLite.
    if (queryInterface.sequelize.getDialect() === 'sqlite') {
      await queryInterface.sequelize.query('ALTER TABLE `user` DROP COLUMN `sessionVersion`');
      return;
    }
    await queryInterface.removeColumn('user', 'sessionVersion');
  },
};
