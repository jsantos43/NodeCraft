'use strict';

/**
 * Drops the legacy barrier/gamertag-access columns from `link`
 * (gamertags / privileges / access) and turns userId into a real, required
 * foreign key to `user` (previously nullable and unconstrained).
 *
 * userId is UUID to match user.id (and instance.id) — NOT BIGINT.
 *
 * @type {import('sequelize-cli').Migration}
 */
const dropColumn = async (queryInterface, table, column) => {
  const description = await queryInterface.describeTable(table);
  if (description[column]) await queryInterface.removeColumn(table, column);
};

const addColumn = async (queryInterface, table, column, spec) => {
  const description = await queryInterface.describeTable(table);
  if (!description[column]) {
    await queryInterface.addColumn(table, column, spec);
    return true;
  }
  return false;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await dropColumn(queryInterface, 'link', 'gamertags');
    await dropColumn(queryInterface, 'link', 'privileges');
    await dropColumn(queryInterface, 'link', 'access');

    // A link now requires a real user. Legacy gamertag-only links (userId NULL)
    // can no longer exist, so drop them before enforcing NOT NULL.
    await queryInterface.bulkDelete('link', { userId: null });

    await queryInterface.changeColumn('link', 'userId', {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.changeColumn('link', 'userId', {
      type: DataTypes.UUID,
      allowNull: true,
    });

    await addColumn(queryInterface, 'link', 'privileges', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await addColumn(queryInterface, 'link', 'access', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'always',
    });

    // MySQL rejects a literal DEFAULT on JSON columns, so add it nullable and
    // backfill existing rows to an empty array.
    const added = await addColumn(queryInterface, 'link', 'gamertags', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    if (added) {
      await queryInterface.bulkUpdate(
        'link',
        { gamertags: JSON.stringify([]) },
        { gamertags: null },
      );
    }
  },
};
