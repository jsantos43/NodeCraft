import {
  mkdirSync,
  rmSync,
  existsSync,
  writeFileSync,
  readFileSync,
  readdirSync,
} from 'fs';
import { Op } from 'sequelize';
import Path from 'path';
import {
  Instance as Model,
  Link as LinkModel,
  User as UserModel,
  Minecraft as MinecraftModel,
  CounterStrike as CounterStrikeModel,
  Kerbal as KerbalModel,
  db,
} from '../models/index.js';
import { BadRequest, Base } from '../errors/index.js';
import Container from './Container.js';
import Link from './Link.js';
import config from '../../config/index.js';
import Storage from './Storage.js';
import File from './File.js';
import {
  running,
  Minecraft as MinecraftRuntime,
  CounterStrike as CounterStrikeRuntime,
  Kerbal as KerbalRuntime,
} from '../runtimes/index.js';
import logger from '../../config/logger.js';

class Instance {
  static async create(userId, instanceData, gameData) {
    // Pick up a server port
    const port = await Instance.selectPort();

    // Create instance in database
    const instanceBase = await Model.create({
      owner: userId,
      port,
      ...instanceData,
    });

    try {
      // Select instance game model
      let gameModel = null;
      if (instanceData.type === 'minecraft') gameModel = MinecraftModel;
      else if (instanceData.type === 'counterstrike') gameModel = CounterStrikeModel;
      else if (instanceData.type === 'kerbal') gameModel = KerbalModel;
      else throw new Base('Game model not found!');

      // Create instance gamedata
      await gameModel.create({
        instanceId: instanceBase.id,
        ...gameData,
      });

      // Create instance path in the System
      mkdirSync(Path.join(config.instance.path, instanceBase.id));
    } catch (err) {
      await Instance.delete(instanceBase.id);

      throw err;
    }

    return instanceBase;
  }

  static async readAll() {
    const instances = await Model.findAll({
      include: {
        model: LinkModel,
        as: 'players',
        include: {
          model: UserModel,
          as: 'user',
          required: false,
        },
      },
    });
    return instances;
  }

  static async personalRead(user) {
    if (user.admin) return Instance.readAll();

    const userInstances = await Model.findAll({
      where: {
        owner: user.id,
      },
    });

    const instancesId = await Link.readInstancesIdByUserLink(user.id);

    const linkInstances = await Model.findAll({
      where: {
        id: { [Op.in]: instancesId },
      },
    });

    const instances = [...userInstances, ...linkInstances];

    return instances;
  }

  static async readOne(id) {
    const includeMap = {
      minecraft: { model: MinecraftModel, as: 'minecraft' },
      counterstrike: { model: CounterStrikeModel, as: 'counterstrike' },
      kerbal: { model: KerbalModel, as: 'kerbal' },
      // terraria: { model: TerrariaConfig, as: 'terraria' },
    };

    const base = await Model.findByPk(id);
    if (!base) throw new BadRequest('Instance not found!');

    const instance = await Model.findByPk(id, {
      include: [
        includeMap[base.type || 'minecraft'],
        {
          model: LinkModel,
          as: 'players',
          include: {
            model: UserModel,
            as: 'user',
            required: false,
          },
        },
      ],
    });

    return instance;
  }

  static async update(id, instanceData, gameData = null) {
    const instance = await Instance.readOne(id);

    await db.transaction(async (t) => {
      // Update instance data
      await instance.update(instanceData, { transaction: t });

      // Update game data
      if (instance.minecraft) await instance.minecraft.update(gameData, { transaction: t });
      if (instance.counterstrike) await instance.counterstrike.update(gameData, { transaction: t });
      if (instance.kerbal) await instance.kerbal.update(gameData, { transaction: t });
    });

    await Container.delete(id);

    return instance;
  }

  static async delete(id) {
    const instance = await Instance.readOne(id);
    await instance.destroy();
    rmSync(Path.join(config.instance.path, id), { recursive: true, force: true });

    return instance;
  }

  static async backup(id) {
    const rcon = running[id]?.rcon;
    // Stop minecraft saving
    if (rcon) {
      await rcon.send('save-all');
      await rcon.send('save-off');
    }

    // Make backup locally
    const backupPath = await File.makeBackup(id);

    if (rcon) await rcon.send('save-on');

    // Delete old backups locally
    File.deleteOldBackups(id, backupPath);

    // Send backup to bucket
    if (config.storage.enable) await Storage.backup(id, backupPath);
  }

  static async maintenanceAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        console.log(instance);
      } catch (err) {
        logger.error({ err }, 'Error in an instance maintenance');
      }
    }
  }

  static async selectPort() {
    const instances = await Instance.readAll();
    const usedPorts = [];
    const availablePorts = [];

    // Find used ports
    instances.forEach((instance) => {
      const serverPort = instance.port;

      if (!usedPorts.includes(serverPort) && !!serverPort) usedPorts.push(serverPort);
    });

    // Find available ports
    for (let port = config.instance.minPort; port <= config.instance.maxPort; port += 1) {
      if (!usedPorts.includes(port)) {
        availablePorts.push(port);
      }
    }

    // Abort if no port available
    if (availablePorts.length === 0) throw new Error('No port available!');

    // Pick a freedom port
    const randomIndex = Math.floor(Math.random() * availablePorts.length);
    const randomPort = availablePorts[randomIndex];

    return randomPort;
  }

  static async run(id) {
    const instance = await Instance.readOne(id);
    await Container.create(instance);

    // Try to run instance
    try {
      let Runtime = null;
      if (instance.type === 'minecraft') Runtime = MinecraftRuntime;
      else if (instance.type === 'counterstrike') Runtime = CounterStrikeRuntime;
      else if (instance.type === 'ksp') Runtime = KerbalRuntime;

      running[id] = new Runtime(instance, () => Instance.readOne(id));
      await instance.update({ status: 'running' });
    } catch (err) {
      await Instance.stop(id);

      throw err;
    }

    return instance;
  }

  static async stop(id) {
    const instance = await Instance.readOne(id);
    await Container.stop(id);

    // Stop runtime instance
    if (running[id]) running[id].finish();

    await instance.update({ status: 'stopped' });
    return instance;
  }

  static async attachAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        if (instance.status === 'running') await Instance.run(instance.id);
      } catch (err) {
        logger.error({ err }, 'Error to attach an instance');
      }
    }
  }

  static async verifyLost() {
    const instancesId = readdirSync(config.instance.path);
    if (!instancesId) return;

    for (const id of instancesId) {
      try {
        const instancePath = Path.join(config.instance.path, id);
        const pendingDeletePath = Path.join(instancePath, '.delete-pending.json');
        const existsPendingDelete = existsSync(pendingDeletePath);

        // Verify if instances exists in database, delete pending process and return
        try {
          const instance = await Model.findByPk(id);
          if (instance) {
            rmSync(pendingDeletePath, { recursive: true, force: true });
            continue;
          }
        } catch (err) {
          continue;
        }

        // Verify if pending delete process exists
        if (existsPendingDelete) {
          // Try to read .delete-pending.json
          const rawData = readFileSync(pendingDeletePath, 'utf8');
          const data = JSON.parse(rawData);

          const time = Number(data?.time);
          const now = Date.now();

          if (!time || now - time >= config.instance.lifetime) {
            // Delete pending instance
            rmSync(instancePath, { recursive: true, force: true });
          }
        } else {
          // Write .delete-pending.json
          writeFileSync(pendingDeletePath, `{"time":${Date.now()}}`, 'utf8');
        }
      } catch (err) {
        logger.error({ err }, 'Error to verify lost instance');
        continue;
      }
    }
  }
}

export default Instance;
