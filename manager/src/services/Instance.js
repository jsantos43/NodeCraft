import { Op } from 'sequelize';
import {
  db,
  gameModels,
  instanceInclude,
  Instance as Model,
} from '../models/index.js';
import { NotFound, Internal, InvalidRequest } from '../errors/index.js';
import Link from './Link.js';
import User from './User.js';
import Worker from './Worker.js';
import config from '../../config/config.js';
import Limit from './Limit.js';
import { summaryAttributes, instanceSummary } from '../utils/instanceView.js';

class Instance {
  static async create(userId, instanceData, gameData) {
    // Select game model
    const gameType = instanceData.type;
    const TargetModel = gameModels[gameType];
    if (!TargetModel) throw new Internal('Game model not found!');

    const port = await Instance.selectPort(instanceData.workerId);

    // Use a Transaction to ensure: either everything is recorded or nothing is.
    return db.transaction(async (t) => {
      // Create instance and game data in an unique command
      const instance = await Model.create({
        ownerId: userId,
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
    const instancesId = user.admin ? [] : await Link.readInstancesIdByUserLink(user.id);

    const instances = await Model.findAll({
      where: user.admin ? {} : {
        [Op.or]: [
          { ownerId: user.id },
          { id: { [Op.in]: instancesId } },
        ],
      },
      attributes: summaryAttributes,
      include: instanceInclude.filter((include) => include.as === 'worker'),
    });

    return instances.map(instanceSummary);
  }

  static async readOne(id) {
    const instance = await Model.findByPk(id, {
      include: instanceInclude,
    });

    if (!instance) throw new NotFound('Instance not found!');

    return instance;
  }

  static async readByWorker(id) {
    const instances = await Model.findAll({
      where: {
        workerId: id,
      },
      include: instanceInclude,
    });

    return instances;
  }

  static async update(id, instanceData, gameData = null) {
    const instance = await Instance.readOne(id);

    const { type, ...changes } = instanceData;

    if (type !== undefined && type !== instance.type) {
      throw new InvalidRequest('The instance type cannot be changed!');
    }

    await Limit.verifyCanUpdate(instance, changes);

    await db.transaction(async (t) => {
      // Update instance basic data
      await instance.update(changes, { transaction: t });

      // Update game data
      if (gameData && instance[instance.type]) {
        await instance[instance.type].update(gameData, { transaction: t });
      }
    });

    return instance;
  }

  static async updateDetails(workerId, id, data) {
    // Scope by workerId: a worker may only report on instances it hosts,
    // never on instances placed on another worker.
    const instance = await Model.findOne({ where: { id, workerId } });
    if (!instance) throw new NotFound('Instance not found on this worker!');
    const workerHistory = data?.history || [];

    // Trimming to config.instance.maxHistory is the model's beforeSave hook.
    const history = [...instance.history, ...workerHistory];

    await instance.update({
      status: data?.status,
      history,
      ...(Number.isFinite(data?.diskUsage) ? { diskUsage: Math.ceil(data.diskUsage) } : {}),
      ...(data?.status === 'running' ? { lastActivityAt: new Date() } : {}),
    });
  }

  static async transferOwner(id, newOwnerId) {
    const instance = await Instance.readOne(id);

    // Throws NotFound if the target user does not exist.
    await User.readOne(newOwnerId);

    if (instance.ownerId !== newOwnerId) {
      await Link.deleteByUserAndInstance(newOwnerId, id);
      await instance.update({ ownerId: newOwnerId });
    }

    return Instance.readOne(id);
  }

  static async changeWorker(id, workerId) {
    const instance = await Instance.readOne(id);

    if (workerId) {
      // Throws NotFound if the target worker does not exist.
      await Worker.readOne(workerId);
    }

    const changes = { workerId: workerId || null };

    // The port is free on the current worker but may be taken on the new one.
    if (workerId && workerId !== instance.workerId) {
      const collision = await Model.findOne({
        where: {
          workerId,
          port: instance.port,
        },
      });

      if (collision) changes.port = await Instance.selectPort(workerId);
    }

    await instance.update(changes);

    return Instance.readOne(id);
  }

  static async remapPort(id) {
    const instance = await Instance.readOne(id);
    const port = await Instance.selectPort(instance.workerId);

    return Instance.update(id, { port });
  }

  static async delete(id) {
    const instance = await Instance.readOne(id);
    await instance.destroy();

    return instance;
  }

  static async updateBackupStatus(workerId, id, data) {
    // Scope by workerId: a worker may only report backups for instances it hosts.
    const instance = await Model.findOne({ where: { id, workerId } });
    if (!instance) throw new NotFound('Instance not found on this worker!');

    await instance.update({
      lastBackupStatus: data.status,
      lastBackupAt: data.status !== 'skipped' ? new Date() : instance.lastBackupAt,
    });
  }

  static async selectPort(workerId = null) {
    const instances = await Model.findAll({
      where: { workerId },
      attributes: ['port'],
    });
    const { minPort, maxPort } = config.instance;

    const usedPorts = [];
    let availablePort;

    // Find used ports
    instances.forEach((instance) => {
      const serverPort = instance.port;

      if (serverPort >= minPort && serverPort <= maxPort) {
        usedPorts.push(serverPort);
      }
    });

    // Verify max used ports
    if (usedPorts.length >= maxPort - minPort + 1) throw new Error('No port available!');

    // Find available port
    for (let port = minPort; port <= maxPort; port += 1) {
      if (!usedPorts.includes(port)) {
        availablePort = port;
        break;
      }
    }

    return availablePort;
  }
}

export default Instance;
