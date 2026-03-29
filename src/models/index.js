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
  constraints: false, // userId can be arbitrary.
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

// Set default game models
const gameModels = {
  minecraft: Minecraft,
  counterstrike: CounterStrike,
  kerbal: Kerbal,
  hytale: Hytale,
  terraria: Terraria,
};

// Define instances query include
const instanceInclude = [
  { model: Minecraft, as: 'minecraft', required: false },
  { model: CounterStrike, as: 'counterstrike', required: false },
  { model: Kerbal, as: 'kerbal', required: false },
  { model: Hytale, as: 'hytale', required: false },
  { model: Terraria, as: 'terraria', required: false },
  {
    model: Link,
    as: 'players',
    include: {
      model: User,
      as: 'user',
      required: false,
    },
  },
];

// await db.sync({ force: true });
await db.query('PRAGMA foreign_keys = ON');

export {
  db,
  gameModels,
  instanceInclude,
  User,
  Instance,
  Link,
};
