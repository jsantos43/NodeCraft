import jwt from 'jsonwebtoken';
import Service from '../services/Worker.js';
import InstanceService from '../services/Instance.js';
import UserService from '../services/User.js';
import AuthService from '../services/Auth.js';
import { Forbidden, Unathorized } from '../errors/index.js';

class Worker {
  static async readAll(req, res, next) {
    try {
      const workers = await Service.readAll();

      return res.status(200).json({ success: true, workers });
    } catch (err) {
      return next(err);
    }
  }

  static async readAvailable(req, res, next) {
    try {
      const workers = await Service.readAvailableForUser(req.user);

      return res.status(200).json({ success: true, workers });
    } catch (err) {
      return next(err);
    }
  }

  static async readOne(req, res, next) {
    try {
      const { id } = req.params;
      const worker = await Service.readOne(id);

      return res.status(200).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { body } = req;

      const { worker, apiKey, secret } = await Service.create(body);

      return res.status(201).json({
        success: true,
        worker,
        apiKey,
        secret,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { body } = req;

      const worker = await Service.update(id, body);

      return res.status(200).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const worker = await Service.delete(id);

      return res.status(200).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async heartbeat(req, res, next) {
    try {
      const { id } = req.params;
      const { body } = req;

      await Service.receiveHeartbeat(id, body);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async readHeartbeats(req, res, next) {
    try {
      const { id } = req.params;
      const range = req?.query?.range;

      const heartbeats = await Service.readHeartbeats(id, range);

      return res.status(200).json({ success: true, heartbeats });
    } catch (err) {
      return next(err);
    }
  }

  static async readInstances(req, res, next) {
    try {
      const { id } = req.params;
      const instances = await InstanceService.readByWorker(id);

      return res.status(200).json({ success: true, instances });
    } catch (err) {
      return next(err);
    }
  }

  static async updateInstance(req, res, next) {
    try {
      const { workerId } = req.params;
      const { instanceId } = req.params;
      const { body } = req;

      await InstanceService.updateDetails(workerId, instanceId, body);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async reportBackupResult(req, res, next) {
    try {
      const { workerId } = req.params;
      const { instanceId } = req.params;
      const { body } = req;

      await InstanceService.updateBackupStatus(workerId, instanceId, body);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async consoleAccess(req, res, next) {
    try {
      const { workerId, instanceId } = req.params;
      const { token } = req.body || {};

      if (typeof token !== 'string') throw new Unathorized('Invalid console token!');

      const worker = await Service.readOneWithSecret(workerId);
      let payload;
      try {
        payload = jwt.verify(token, worker.secret);
      } catch {
        throw new Unathorized('Invalid console token!');
      }

      if (payload.purpose !== 'console' || payload.instanceId !== instanceId
        || typeof payload.sub !== 'string' || !payload.sub
        || !Number.isSafeInteger(payload.sessionVersion) || payload.sessionVersion < 0) {
        throw new Unathorized('Invalid console token!');
      }

      const instance = await InstanceService.readOne(instanceId);
      if (instance.workerId !== workerId) throw new Forbidden('Instance is not on this worker!');

      const user = await UserService.readOne(payload.sub, payload.sessionVersion);

      const permissions = await AuthService.permissionsForInstance(user, instance);

      const granted = Array.isArray(payload.permissions) ? payload.permissions : [];

      const canRead = granted.includes('console:read')
        && permissions.includes('instance:console:read');

      const canWrite = canRead && granted.includes('console:write')
        && permissions.includes('instance:console:write');

      return res.status(200).json({ success: true, canRead, canWrite });
    } catch (err) {
      return next(err);
    }
  }
}

export default Worker;
