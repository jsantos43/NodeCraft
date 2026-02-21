import User from './User.js';
import Instance from './Instance.js';
import Link from './Link.js';
import db from '../../config/sequelize.js';
import Minecraft from './Minecraft.js';
import CounterStrike from './CounterStrike.js';
import Kerbal from './Kerbal.js';
import Hytale from './Hytale.js';
import Terraria from './Terraria.js';

// instance <-> link
Instance.hasMany(Link, {
  foreignKey: 'instanceId',
  as: 'players',
  onDelete: 'CASCADE',
  hooks: true,
});

Link.belongsTo(Instance, {
  foreignKey: 'instanceId',
  as: 'instance',
});

// user <-> link
User.hasMany(Link, {
  foreignKey: 'userId',
  as: 'instances',
});

Link.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  constraints: false, // userId pode ser arbitrário
});

// user <-> instance
User.hasMany(Instance, {
  foreignKey: 'owner',
  as: 'ownedInstances',
  onDelete: 'CASCADE',
  hooks: true,
});

Instance.belongsTo(User, {
  foreignKey: 'owner',
  as: 'ownerUser',
});

// instance <--> minecraft
Instance.hasOne(Minecraft, {
  foreignKey: 'instanceId',
  as: 'minecraft',
  onDelete: 'CASCADE',
});

Minecraft.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> counter strike
Instance.hasOne(CounterStrike, {
  foreignKey: 'instanceId',
  as: 'counterstrike',
  onDelete: 'CASCADE',
});

CounterStrike.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> ksp
Instance.hasOne(Kerbal, {
  foreignKey: 'instanceId',
  as: 'kerbal',
  onDelete: 'CASCADE',
});

Kerbal.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> hytale
Instance.hasOne(Hytale, {
  foreignKey: 'instanceId',
  as: 'hytale',
  onDelete: 'CASCADE',
});

Hytale.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> terraria
Instance.hasOne(Terraria, {
  foreignKey: 'instanceId',
  as: 'terraria',
  onDelete: 'CASCADE',
});

Terraria.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// await db.sync({ force: true });
await db.query('PRAGMA foreign_keys = ON');

export {
  db,
  User,
  Instance,
  Link,
  Minecraft,
  CounterStrike,
  Kerbal,
  Hytale,
  Terraria,
};
