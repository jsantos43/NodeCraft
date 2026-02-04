/* eslint-disable no-new */
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
  db,
} from '../models/index.js';
import { BadRequest } from '../errors/index.js';
import Container from './Container.js';
import Link from './Link.js';
import config from '../../config/index.js';
import Storage from './Storage.js';
import File from './File.js';
import MinecraftRuntime from '../runtime/Minecraft.js';
import CSRuntime from '../runtime/CounterStrike.js';
import instancesRunning from '../runtime/instancesRunning.js';
import logger from '../../config/logger.js';

class Instance {
  static async create(userId, instanceData, gameData) {
    // Pick up a server port
    const port = await Instance.selectPort();

    // Create instance in the Database
    const instanceBase = await Model.create({
      owner: userId,
      port,
      ...instanceData,
    });

    // Select instance game model
    let gameModel = MinecraftModel;
    if (instanceData.type === 'counterstrike') gameModel = CounterStrikeModel;

    // Create instance gamedata
    await gameModel.create({
      instanceId: instanceBase.id,
      ...gameData,
    });

    // Full instance read
    const instance = await Instance.readOne(instanceBase.id);

    // Create instance path in the System
    mkdirSync(Path.join(config.instance.path, instanceBase.id));

    // Create docker container
    await Container.create(instance);

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
    });

    return instance;
  }

  static async updateAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        // if (instance.updateAlways) await Instance.install(instance);
      } catch (err) {
        logger.error({ err }, 'Error to update an instance');
      }
    }
  }

  static async delete(id) {
    const instance = await Instance.readOne(id);
    await instance.destroy();
    rmSync(Path.join(config.instance.path, id), { recursive: true, force: true });

    return instance;
  }

  static async backup(id) {
    const rcon = instancesRunning[id]?.rcon;
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

  static async backupAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        if (instance.backup) await Instance.backup(instance.id);
      } catch (err) {
        logger.error({ err }, 'Error to backup an instance');
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
      if (instance.type === 'minecraft') new MinecraftRuntime(instance, () => Instance.readOne(id));
      if (instance.type === 'counterstrike') new CSRuntime(instance, () => Instance.readOne(id));

      // Set instance running
      await instance.update({ running: true });
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
    if (instancesRunning[id]) instancesRunning[id].stop();

    // Update running instance status
    await instance.update({ running: false });

    return instance;
  }

  static async attachAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        if (instance.running) await Instance.run(instance.id);
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
