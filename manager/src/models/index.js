import User from './User.js';
import Instance from './Instance.js';
import Link from './Link.js';
import Worker from './Worker.js';
import WorkerHeartbeat from './WorkerHeartbeat.js';
import db from '../../config/sequelize.js';
import Minecraft from './Minecraft.js';
import CounterStrike from './CounterStrike.js';
import Kerbal from './Kerbal.js';
import Hytale from './Hytale.js';
import Terraria from './Terraria.js';

// instance <-> link
Instance.hasMany(Link, {
  foreignKey: 'instanceId',
  as: 'links',
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
  onDelete: 'CASCADE',
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

// worker <-> instance
Worker.hasMany(Instance, {
  foreignKey: 'workerId',
  as: 'instances',
  onDelete: 'SET NULL',
  hooks: true,
});

Instance.belongsTo(Worker, {
  foreignKey: 'workerId',
  as: 'worker',
});

// worker <-> heartbeat
Worker.hasMany(WorkerHeartbeat, {
  foreignKey: 'workerId',
  as: 'heartbeats',
  onDelete: 'CASCADE',
  hooks: true,
});

WorkerHeartbeat.belongsTo(Worker, {
  foreignKey: 'workerId',
  as: 'worker',
});

// instance <--> minecraft
Instance.hasOne(Minecraft, {
  foreignKey: 'instanceId',
  as: 'minecraft',
  onDelete: 'CASCADE',
  hooks: true,
});

Minecraft.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> counter strike
Instance.hasOne(CounterStrike, {
  foreignKey: 'instanceId',
  as: 'counterstrike',
  onDelete: 'CASCADE',
  hooks: true,
});

CounterStrike.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> ksp
Instance.hasOne(Kerbal, {
  foreignKey: 'instanceId',
  as: 'kerbal',
  onDelete: 'CASCADE',
  hooks: true,
});

Kerbal.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> hytale
Instance.hasOne(Hytale, {
  foreignKey: 'instanceId',
  as: 'hytale',
  onDelete: 'CASCADE',
  hooks: true,
});

Hytale.belongsTo(Instance, {
  foreignKey: 'instanceId',
});

// instance <--> terraria
Instance.hasOne(Terraria, {
  foreignKey: 'instanceId',
  as: 'terraria',
  onDelete: 'CASCADE',
  hooks: true,
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
  // Only expose safe worker fields to clients (never apiKey/secret).
  {
    model: Worker,
    as: 'worker',
    required: false,
    attributes: ['id', 'name', 'url', 'healthy'],
  },
  {
    model: Link,
    as: 'links',
    include: {
      model: User,
      as: 'user',
      required: false,
    },
  },
];

export {
  db,
  gameModels,
  instanceInclude,
  User,
  Instance,
  Link,
  Worker,
  WorkerHeartbeat,
};
