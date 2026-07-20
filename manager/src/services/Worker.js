import { Op } from 'sequelize';
import Auth from './Auth.js';
import {
  Worker as Model,
  WorkerHeartbeat as HeartbeatModel,
} from '../models/index.js';
import { NotFound } from '../errors/index.js';
import logger from '../../config/logger.js';

const HEARTBEAT_RETENTION_DAYS = 7;
const HEARTBEAT_RETENTION_MS = HEARTBEAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const DEAD_THRESHOLD = 3 * 60 * 1000; // 3 minutes
const CHECK_INTERVAL = 60 * 1000; // 1 minute

const HEARTBEAT_RANGES = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

class Worker {
  static async create(data) {
    const apiKey = Auth.generateRandomToken();
    const secret = Auth.generateRandomToken();

    const worker = await Model.create({
      name: data.name,
      apiKey: Auth.hashToken(apiKey),
      secret,
    });

    return { worker, apiKey, secret };
  }

  static async readAll() {
    const workers = await Model.findAll();

    return workers;
  }

  static async readAvailableForUser(user) {
    const ids = Array.isArray(user?.allowedWorkers) ? user.allowedWorkers : [];
    if (ids.length === 0) return [];

    const workers = await Model.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: [
        'id', 'name', 'url', 'healthy', 'lastSeenAt',
        'cpuUsage', 'memorieTotal', 'memorieUsed', 'diskAvailable',
      ],
    });

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

  static async receiveHeartbeat(id, data) {
    const info = {
      healthy: true,
      lastSeenAt: Date.now(),
      cpuUsage: data.cpuUsage,
      memorieTotal: data.memorieTotal,
      memorieUsed: data.memorieUsed,
      diskAvailable: data.diskAvailable,
    };

    const worker = await Worker.update(id, info);
    await Worker.recordHeartbeat(id, data);

    return worker;
  }

  static async recordHeartbeat(id, data) {
    await HeartbeatModel.create({
      workerId: id,
      cpuUsage: data.cpuUsage,
      memorieTotal: data.memorieTotal,
      memorieUsed: data.memorieUsed,
      diskAvailable: data.diskAvailable,
    });

    await Worker.pruneHeartbeats(id);
  }

  static async pruneHeartbeats(id) {
    const cutoff = new Date(Date.now() - HEARTBEAT_RETENTION_MS);

    await HeartbeatModel.destroy({
      where: {
        workerId: id,
        createdAt: { [Op.lt]: cutoff },
      },
    });
  }

  static async readHeartbeats(id, range) {
    await Worker.readOne(id);

    const windowMs = HEARTBEAT_RANGES[range] || HEARTBEAT_RETENTION_MS;
    const cutoff = new Date(Date.now() - windowMs);

    const heartbeats = await HeartbeatModel.findAll({
      where: {
        workerId: id,
        createdAt: { [Op.gte]: cutoff },
      },
      order: [['createdAt', 'ASC']],
    });

    return heartbeats;
  }

  static compareApiKey(apiKey, storedApiKey) {
    const hashedApiKey = Auth.hashToken(apiKey);

    return hashedApiKey === storedApiKey;
  }

  static startChecker() {
    setInterval(Worker.checkAll, CHECK_INTERVAL);

    Worker.checkAll();
  }

  static async checkAll() {
    try {
      const timeoff = Date.now() - DEAD_THRESHOLD;

      await Model.update(
        { healthy: false },
        {
          where: {
            healthy: true,
            lastSeenAt: { [Op.lt]: timeoff },
          },
        },
      );
    } catch (err) {
      logger.error({ err }, 'Error to verify dead worker!');
    }
  }
}

export default Worker;
