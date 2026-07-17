import { Instance as InstanceModel } from '../models/index.js';
import User from './User.js';
import { Forbidden } from '../errors/index.js';

class Limit {
  static async readUsage(userId) {
    const user = await User.readOne(userId);

    const instances = await InstanceModel.findAll({
      where: { owner: userId },
      attributes: ['memory', 'cpu', 'diskUsage', 'status'],
    });

    const usage = instances.reduce((acc, instance) => {
      const running = instance.status === 'running';
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

  static async verifyCanCreate(userId, instanceData) {
    const { user, usage } = await Limit.readUsage(userId);

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
  }

  static async verifyCanStart(instance) {
    const { user, usage } = await Limit.readUsage(instance.owner);

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
