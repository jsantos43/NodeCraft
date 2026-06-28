import { User, Instance as InstanceModel } from '../models/index.js';
import { Forbidden, NotFound } from '../errors/index.js';

class Quota {
  // Load the quota owner and the instances that count against their budget.
  static async readUsage(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFound('User not found!');

    const instances = await InstanceModel.findAll({
      where: { owner: userId },
      attributes: ['memory', 'cpu', 'diskUsage'],
    });

    const usage = instances.reduce((acc, instance) => ({
      count: acc.count + 1,
      memory: acc.memory + instance.memory,
      cpu: acc.cpu + instance.cpu,
      disk: acc.disk + instance.diskUsage,
    }), {
      count: 0, memory: 0, cpu: 0, disk: 0,
    });

    return { user, usage };
  }

  // Enforced before creating a new instance.
  static async verifyCanCreate(userId, instanceData) {
    const { user, usage } = await Quota.readUsage(userId);

    const { type } = instanceData;
    // Mirror the Instance model defaults when the request omits them.
    const memory = instanceData.memory || 0;
    const cpu = instanceData.cpu || 0;

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

    if (usage.memory + memory > user.maxMemory) {
      throw new Forbidden('You have exceeded your memory quota!');
    }

    if (usage.cpu + cpu > user.maxCpu) {
      throw new Forbidden('You have exceeded your cpu quota!');
    }
  }

  // Enforced before starting an instance (disk is reported asynchronously by the worker).
  static async verifyCanStart(instance) {
    const { user, usage } = await Quota.readUsage(instance.owner);

    if (usage.disk > user.maxDisk) {
      throw new Forbidden('You have exceeded your disk quota!');
    }
  }
}

export default Quota;
