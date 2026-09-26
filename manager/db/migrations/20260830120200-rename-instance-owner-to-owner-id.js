'use strict';

/**
 * `instance.owner` -> `instance.ownerId`, matching workerId / userId /
 * instanceId. It always held a user id, and the bare name read like a
 * relation rather than a foreign key.
 *
 * Same SQLite caveat as the memorie -> memory rename: queryInterface.renameColumn
 * rebuilds the table, and rebuilding `instance` while link/roster/minecraft/
 * kerbal/hytale/terraria reference it aborts on a FOREIGN KEY failure. Raw
 * `ALTER TABLE ... RENAME COLUMN` (SQLite 3.25+) renames in place instead.
 *
 * MySQL also needs a native rename (MySQL 8.0+): Sequelize's renameColumn
 * emits CHANGE with a reconstructed definition that loses the UUID column's
 * charset/collation, making it incompatible with user.id. Renaming in place
 * preserves the definition and the foreign key, in both directions.
 *
 * Note this also renames the field in the API: instance payloads now carry
 * `ownerId`, and PUT /instance/:id/owner takes `{ ownerId }`. The route path and
 * the `instance:owner` permission are unchanged.
 *
 * @type {import('sequelize-cli').Migration}
 */
const rename = async (queryInterface, from, to) => {
  const description = await queryInterface.describeTable('instance');
  if (!description[from] || description[to]) return;

  if (['sqlite', 'mysql'].includes(queryInterface.sequelize.getDialect())) {
    await queryInterface.sequelize.query(
      `ALTER TABLE \`instance\` RENAME COLUMN \`${from}\` TO \`${to}\``,
    );
    return;
  }

  await queryInterface.renameColumn('instance', from, to);
};

module.exports = {
  async up(queryInterface) {
    await rename(queryInterface, 'owner', 'ownerId');
  },

  async down(queryInterface) {
    await rename(queryInterface, 'ownerId', 'owner');
  },
};
