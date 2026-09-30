import { Instance as InstanceModel } from '../models/index.js';
import User from './User.js';
import { Forbidden } from '../errors/index.js';

class Limit {
  static async readUsage(userId, excludeResourceInstanceId = null) {
    const user = await User.readOne(userId);

    const instances = await InstanceModel.findAll({
      where: { ownerId: userId },
      attributes: ['id', 'memory', 'cpu', 'diskUsage', 'status'],
    });

    const usage = instances.reduce((acc, instance) => {
      // Restart replaces this instance's allocation; still count its disk and slot.
      const running = instance.status === 'running' && instance.id !== excludeResourceInstanceId;
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

    const user = await User.readOne(instance.ownerId);
    Limit.verifyInstanceResources(user, {
      memory: changes.memory ?? instance.memory,
      cpu: changes.cpu ?? instance.cpu,
    });
  }

  static async verifyCanStart(instance) {
    const { user, usage } = await Limit.readUsage(instance.ownerId, instance.id);

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
