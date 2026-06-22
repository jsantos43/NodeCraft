import { Op } from 'sequelize';
import Auth from './Auth.js';
import {
  Worker as Model,
  WorkerHeartbeat as HeartbeatModel,
  Instance as InstanceModel,
  instanceInclude,
} from '../models/index.js';
import { NotFound } from '../errors/index.js';
import Instance from './Instance.js';

const MAX_INSTANCE_HISTORY = 45;
const HEARTBEAT_RETENTION_DAYS = 7;
const HEARTBEAT_RETENTION_MS = HEARTBEAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

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

  static async readInstancesByWorker(id) {
    const instances = await InstanceModel.findAll({
      where: {
        workerId: id,
      },
      include: instanceInclude,
    });

    return instances;
  }

  static async updateInstanceDetails(id, data) {
    const instance = await Instance.readOne(id);
    const workerHistory = data?.history || [];

    // Wipe old lines
    let history = [...instance.history, ...workerHistory];
    if (history.length > MAX_INSTANCE_HISTORY) {
      history = history.slice(history.length - MAX_INSTANCE_HISTORY);
    }

    await instance.update({
      status: data?.status,
      history,
      ...(data?.status === 'running' ? { lastActivityAt: new Date() } : {}),
    });
  }

  static async updateInstanceBackupStatus(instanceId, data) {
    await Instance.updateBackupStatus(instanceId, data);
  }

  static compareApiKey(apiKey, storedApiKey) {
    const hashedApiKey = Auth.hashToken(apiKey);

    return hashedApiKey === storedApiKey;
  }
}

export default Worker;
