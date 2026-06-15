'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('workers', 'lastSeenAt', {
    type: Sequelize.DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('workers', 'lastSeenAt', {
    type: Sequelize.DataTypes.TIME,
    allowNull: true,
  });
}
