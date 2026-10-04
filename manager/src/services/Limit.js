import { Transaction } from 'sequelize';
import { db, User as UserModel, Instance as InstanceModel } from '../models/index.js';
import { Forbidden, NotFound } from '../errors/index.js';

// SQLite uses one writer; serialize this process as well (including in-memory databases).
let sqliteQueue = Promise.resolve();

class Limit {
  static async withOwner(userId, action) {
    const execute = () => db.transaction({
      ...(db.getDialect() === 'sqlite'
        ? { type: Transaction.TYPES.IMMEDIATE }
        : { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }),
    }, async (transaction) => {
      const user = await UserModel.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });

      if (!user) throw new NotFound('User not found!');

      return action(transaction);
    });

    if (db.getDialect() !== 'sqlite') return execute();

    const result = sqliteQueue.then(execute);

    sqliteQueue = result.catch(() => {});

    return result;
  }

  static async readUsage(userId, excludeResourceInstanceId = null, transaction = undefined) {
    const user = await UserModel.findByPk(userId, { transaction });

    if (!user) throw new NotFound('User not found!');

    const instances = await InstanceModel.findAll({
      where: { ownerId: userId },
      transaction,
      attributes: ['id', 'memory', 'cpu', 'diskUsage', 'status'],
    });

    const usage = instances.reduce((acc, instance) => {
      // Restart replaces this instance's allocation; still count its disk and slot.
      const running = ['running', 'starting'].includes(instance.status) && instance.id !== excludeResourceInstanceId;
      return {
        count: acc.count + 1,
        disk: acc.disk + instance.diskUsage,
        memory: acc.memory + (running ? instance.memory : 0),
        cpu: acc.cpu + (running ? instance.cpu : 0),
      };
    }, {
      count: 0, disk: 0, memory: 0, cpu: 0,
    });

    return { user, usage };
  }

  static async verifyCanCreate(userId, instanceData, transaction = undefined) {
    const { user, usage } = await Limit.readUsage(userId, null, transaction);

    const { type } = instanceData;

    if (!user.allowedGames.includes(type)) {
      throw new Forbidden('Game type is not allowed for your account!');
    }

    if (user.allowedWorkers.length === 0) {
      throw new Forbidden('You are not allowed to use any worker!');
    }

    const { workerId } = instanceData;
    if (workerId && !user.allowedWorkers.includes(workerId)) {
      throw new Forbidden('This worker is not allowed for your account!');
    }

    if (usage.count >= user.maxInstances) {
      throw new Forbidden('You have reached your instance limit!');
    }

    if (usage.disk >= user.maxDisk) {
      throw new Forbidden('You have exceeded your disk quota!');
    }

    const { memory, cpu } = InstanceModel.build(instanceData);
    Limit.verifyInstanceResources(user, { memory, cpu });
  }

  static verifyInstanceResources(user, { memory, cpu }) {
    if (memory > user.maxMemory) {
      throw new Forbidden('This instance asks for more memory than your quota!');
    }

    if (cpu > user.maxCpu) {
      throw new Forbidden('This instance asks for more cpu than your quota!');
    }
  }

  static async verifyCanUpdate(instance, changes) {
    if (changes.memory === undefined && changes.cpu === undefined) return;

    const user = await UserModel.findByPk(instance.ownerId);
    Limit.verifyInstanceResources(user, {
      memory: changes.memory ?? instance.memory,
      cpu: changes.cpu ?? instance.cpu,
    });
  }

  static async verifyCanStart(instance, transaction = undefined) {
    const { user, usage } = await Limit.readUsage(instance.ownerId, instance.id, transaction);

    if (usage.disk > user.maxDisk) {
      throw new Forbidden('You have exceeded your disk quota!');
    }

    if (usage.memory + instance.memory > user.maxMemory) {
      throw new Forbidden('You have exceeded your memory quota!');
    }

    if (usage.cpu + instance.cpu > user.maxCpu) {
      throw new Forbidden('You have exceeded your cpu quota!');
    }
  }
}

export default Limit;
