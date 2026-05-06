import { Op } from 'sequelize';
import Path from 'path';
import {
  db,
  gameModels,
  instanceInclude,
  Instance as Model,
} from '../models/index.js';
import { NotFound, Internal } from '../errors/index.js';
// import Container from './Container.js';
import Link from './Link.js';
import config from '../../config/config.js';
// import Backup from './Backup.js';
// import File from './File.js';
// import { running, gameRuntimes } from '../../../worker/runtimes/index.js';
import logger from '../../config/logger.js';

class Instance {
  static async create(userId, instanceData, gameData) {
    // Select game model
    const gameType = instanceData.type;
    const TargetModel = gameModels[gameType];
    if (!TargetModel) throw new Internal('Game model not found!');

    // Pick up a server port
    const port = await Instance.selectPort();

    // Use a Transaction to ensure: either everything is recorded or nothing is.
    return db.transaction(async (t) => {
      // Create instance and game data in an unique command
      const instance = await Model.create({
        owner: userId,
        port,
        ...instanceData,
        [gameType]: gameData,
      }, {
        include: [{ model: TargetModel, as: gameType }],
        transaction: t,
      });

      await File.createOneDirectory(Path.join(config.instance.path, instance.id));

      return instance;
    });
  }

  static async readAll() {
    const instances = await Model.findAll({
      include: instanceInclude,
    });

    return instances;
  }

  static async personalRead(user) {
    if (user.admin) return Instance.readAll();

    const userInstances = await Model.findAll({
      where: {
        owner: user.id,
      },
      include: instanceInclude,
    });

    const instancesId = await Link.readInstancesIdByUserLink(user.id);

    const linkInstances = await Model.findAll({
      where: {
        id: { [Op.in]: instancesId },
      },
      include: instanceInclude,
    });

    const instances = [...userInstances, ...linkInstances];

    return instances;
  }

  static async readOne(id) {
    const instance = await Model.findByPk(id, {
      include: instanceInclude,
    });

    if (!instance) throw new NotFound('Instance not found!');

    return instance;
  }

  static async update(id, instanceData, gameData = null) {
    const instance = await Instance.readOne(id);

    await db.transaction(async (t) => {
      // Update instance basic data
      await instance.update(instanceData, { transaction: t });

      // Update game data
      if (gameData && instance[instance.type]) {
        await instance[instance.type].update(gameData, { transaction: t });
      }
    });

    // await Container.delete(id);

    return instance;
  }

  static async delete(id) {
    const instance = await Instance.readOne(id, true);
    await instance.destroy();
    // Container.delete(id);
    File.delete(Path.join(config.instance.path, id));

    return instance;
  }

  static async maintenanceAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        const isRunning = instance.status === 'running';

        await Instance.stop(instance.id);

        // await Backup.execute(instance);

        if (isRunning) await Instance.run(instance.id);
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
    // await Container.create(instance);

    // try {
    //   const Runtime = gameRuntimes[instance.type];
    //   if (!Runtime) throw new Internal('Instace game runtime not found!');

    //   running[id] = new Runtime(instance, () => Instance.readOne(id));
    //   await instance.update({ status: 'running' });
    // } catch (err) {
    //   await Instance.stop(id);

    //   throw err;
    // }

    return instance;
  }

  static async stop(id) {
    // const instance = await Instance.readOne(id);
    // await Container.stop(id);

    // // Stop runtime instance
    // if (running[id]) running[id].finish();
    // delete running[id];
    // await Container.delete(id);

    // await instance.update({ status: 'stopped' });
    // return instance;
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
    const instancesId = await File.readOneDirectory(config.instance.path);
    if (!instancesId) return;

    for (const id of instancesId) {
      try {
        const instancePath = Path.join(config.instance.path, id);
        const pendingDeletePath = Path.join(instancePath, '.delete-pending.json');
        const existsPendingDelete = await File.verifyExists(pendingDeletePath);

        // Verify if instances exists in database, delete pending process and return
        try {
          const instance = await Model.findByPk(id);
          if (instance) {
            await File.delete(pendingDeletePath);
            continue;
          }
        } catch (err) {
          continue;
        }

        // Verify if pending delete process exists
        if (existsPendingDelete) {
          // Try to read .delete-pending.json
          const rawData = await File.readOneFile(pendingDeletePath);
          const data = JSON.parse(rawData);

          const time = Number(data?.time);
          const now = Date.now();

          if (!time || now - time >= config.instance.lifetime) {
            // Delete pending instance
            await File.delete(instancePath);
          }
        } else {
          // Write .delete-pending.json
          await File.createOneFile(pendingDeletePath, `{"time":${Date.now()}}`);
        }
      } catch (err) {
        logger.error({ err }, 'Error to verify lost instance');
        continue;
      }
    }
  }
}

export default Instance;
