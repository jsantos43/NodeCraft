'use strict';

/**
 * Brings prod schema in line with the models for columns that were only ever
 * created via db.sync in dev and never had a migration:
 *   - instance.diskUsage
 *   - user.maxInstances / maxMemory / maxCpu / maxDisk / allowedGames
 *
 * Every add is guarded with describeTable so the migration is safe whether or
 * not a given column already exists (e.g. allowedWorkers was added separately).
 *
 * @type {import('sequelize-cli').Migration}
 */
const DEFAULT_GAMES = ['minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal'];

const ensureColumn = async (queryInterface, table, column, spec) => {
  const description = await queryInterface.describeTable(table);
  if (!description[column]) {
    await queryInterface.addColumn(table, column, spec);
    return true;
  }
  return false;
};

const dropColumn = async (queryInterface, table, column) => {
  const description = await queryInterface.describeTable(table);
  if (description[column]) {
    await queryInterface.removeColumn(table, column);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await ensureColumn(queryInterface, 'instance', 'diskUsage', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await ensureColumn(queryInterface, 'user', 'maxInstances', {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
    });
    await ensureColumn(queryInterface, 'user', 'maxMemory', {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
    });
    await ensureColumn(queryInterface, 'user', 'maxCpu', {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
    });
    await ensureColumn(queryInterface, 'user', 'maxDisk', {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 5120,
    });

    // MySQL rejects literal DEFAULTs on JSON columns, so add it nullable and
    // backfill existing rows, matching the model's default of all games.
    const added = await ensureColumn(queryInterface, 'user', 'allowedGames', {
      type: DataTypes.JSON,
      allowNull: true,
    });
    if (added) {
      await queryInterface.bulkUpdate(
        'user',
        { allowedGames: JSON.stringify(DEFAULT_GAMES) },
        { allowedGames: null },
      );
    }
  },

  async down(queryInterface) {
    await dropColumn(queryInterface, 'user', 'allowedGames');
    await dropColumn(queryInterface, 'user', 'maxDisk');
    await dropColumn(queryInterface, 'user', 'maxCpu');
    await dropColumn(queryInterface, 'user', 'maxMemory');
    await dropColumn(queryInterface, 'user', 'maxInstances');
    await dropColumn(queryInterface, 'instance', 'diskUsage');
  },
};
