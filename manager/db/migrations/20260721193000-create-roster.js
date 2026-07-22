'use strict';

/**
 * Creates the `roster` table: the game-agnostic allow-list of authorized
 * player identities per instance (replaces the old barrier data that lived on
 * `link`). Identity is the canonical, immutable `identifier` (Mojang UUID /
 * XUID / SteamID64); `name` is a refreshable display cache. `platform`
 * discriminates how the worker resolves and applies each entry.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.createTable('roster', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      instanceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'instance', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      identifier: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'java',
      },
      access: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member',
      },
      privileged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });

    // One authorization per identity per platform inside an instance.
    await queryInterface.addConstraint('roster', {
      fields: ['instanceId', 'platform', 'identifier'],
      type: 'unique',
      name: 'roster_instance_platform_identifier_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roster');
  },
};
