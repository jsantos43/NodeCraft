import { Op } from 'sequelize';
import {
  db,
  gameModels,
  instanceInclude,
  Instance as Model,
} from '../models/index.js';
import { NotFound, Internal } from '../errors/index.js';
import Link from './Link.js';
import config from '../../config/config.js';

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

    return instance;
  }

  static async delete(id) {
    const instance = await Instance.readOne(id);
    await instance.destroy();

    return instance;
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
}

export default Instance;
