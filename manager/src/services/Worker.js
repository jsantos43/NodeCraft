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
    await worker.update({ name: data?.name });

    return worker;
  }

  static async delete(id) {
    const worker = await Worker.readOne(id);
    await worker.destroy();

    return worker;
  }
}

export default Worker;
