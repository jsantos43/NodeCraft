import Auth from './Auth.js';
import { Worker as Model } from '../models/index.js';
import { NotFound } from '../errors/index.js';

class Worker {
  static async create(data) {
    const apiKey = Auth.generateRandomToken();

    const worker = await Model.create({
      name: data.name,
      apiKey: Auth.hashToken(apiKey),
    });

    return { worker, apiKey };
  }

  static async readAll() {
    const workers = await Model.findAll();

    return workers;
  }

  static async readOne(id) {
    const worker = await Model.findByPk(id);

    if (!worker) throw new NotFound('Worker not found!');

    return worker;
  }

  static async update(id, data) {
    const worker = await Worker.readOne(id);
    await worker.update(data);

    return worker;
  }

  static async delete(id) {
    const worker = await Worker.readOne(id);
    await worker.destroy();

    return worker;
  }

  static async updateHeartBeat(id, data) {
    const info = {
      healthy: true,
      lastSeenAt: Date.now(),
      cpuUsage: data.cpuUsage,
      memorieTotal: data.memorieTotal,
      memorieUsed: data.memorieUsed,
      diskTotal: data.diskTotal,
      diskUsed: data.diskUsed,
    };

    const worker = await Worker.update(id, info);

    return worker;
  }

  static async compareApiKey(apiKey, storedApiKey) {
    const hashedApiKey = Auth.hashToken(apiKey);

    return hashedApiKey === storedApiKey;
  }
}

export default Worker;
