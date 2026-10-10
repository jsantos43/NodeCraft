import jwt from 'jsonwebtoken';
import logger from '../../config/logger.js';
import { Internal, InvalidRequest } from '../errors/index.js';
import Service from '../services/Instance.js';
import AuthService from '../services/Auth.js';
import getWorkerContext from '../utils/getWorkerContext.js';
import proxyFetch, { discardWorkerResponse } from '../utils/proxyFetch.js';
import { instanceView } from '../utils/instanceView.js';

class Instance {
  static async create(req, res, next) {
    try {
      const { body, user } = req;

      // Get instance data
      const instanceData = { ...body };
      delete instanceData.game;
      const gameData = body?.game || {};

      const instance = await Service.create(user.id, instanceData, gameData);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(201).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async readAll(req, res, next) {
    try {
      const { user } = req;
      const instances = await Service.personalRead(user);

      return res.status(200).json({ success: true, instances });
    } catch (err) {
      return next(err);
    }
  }

  static async readOne(req, res, next) {
    try {
      const { id } = req.params;
      const instance = await Service.readOne(id);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { body } = req;

      // Get instance data
      const instanceData = { ...body };
      delete instanceData.game;
      const gameData = body?.game || {};

      const instance = await Service.update(id, instanceData, gameData);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async transferOwner(req, res, next) {
    try {
      const { id } = req.params;
      const { ownerId } = req.body;

      const instance = await Service.transferOwner(id, ownerId);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async changeWorker(req, res, next) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;

      const instance = await Service.changeWorker(id, workerId);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const instance = await Service.delete(id);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async run(req, res, next) {
    try {
      const { id } = req.params;

      const { worker } = await getWorkerContext(id);
      const instance = await Service.markStarting(id);

      const route = `${worker.url}/server/${id}/run`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      await discardWorkerResponse(response);

      if (!response.ok) throw new Internal('Failed the run request to worker!');

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async stop(req, res, next) {
    try {
      const { id } = req.params;

      const { instance, worker } = await getWorkerContext(id);

      if (instance.status === 'starting') throw new InvalidRequest('Wait for the instance to finish starting!');

      const route = `${worker.url}/server/${id}/stop`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      await discardWorkerResponse(response);

      if (!response.ok) throw new Internal('Failed the stop request to worker!');

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async restart(req, res, next) {
    try {
      const { id } = req.params;

      const { worker } = await getWorkerContext(id);
      const instance = await Service.markStarting(id, true);

      const route = `${worker.url}/server/${id}/restart`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      await discardWorkerResponse(response);

      if (!response.ok) throw new Internal('Failed the restart request to worker!');

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async remapPort(req, res, next) {
    try {
      const { id } = req.params;
      const instance = await Service.remapPort(id);

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      return next(err);
    }
  }

  static async readPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;

      const permissions = await AuthService.getInstancePermissions(user, id);

      return res.status(200).json({ success: true, permissions });
    } catch (err) {
      return next(err);
    }
  }

  static async consoleToken(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;

      const { worker } = await getWorkerContext(id);

      // Verify if user can write in console too
      const canWrite = await AuthService.checkPermission(user, 'instance:console:write', id);
      const permissions = ['console:read'];
      if (canWrite) permissions.push('console:write');

      const token = jwt.sign(
        {
          sub: user.id,
          instanceId: id,
          purpose: 'console',
          permissions,
          sessionVersion: req.authSessionVersion,
        },
        worker.secret,
        { expiresIn: 120 },
      );

      return res.status(200).json({
        success: true, token, workerUrl: worker.url, permissions,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async backup(req, res, next) {
    let pendingInstance = null;
    let previousStatus = null;

    try {
      const { id } = req.params;

      const { instance, worker } = await getWorkerContext(id);
      pendingInstance = instance;
      previousStatus = instance.lastBackupStatus;

      // Clear the previous result before dispatch so a skipped attempt can be
      // distinguished from a previous skipped backup while the UI polls.
      await instance.update({ lastBackupStatus: null });

      const route = `${worker.url}/server/${id}/backup`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      await discardWorkerResponse(response);

      if (!response.ok) throw new Internal('Failed the backup request to worker!');

      const permissions = await AuthService.permissionsForInstance(req.user, instance);
      return res.status(200).json({ success: true, instance: instanceView(instance, permissions) });
    } catch (err) {
      if (pendingInstance) {
        try {
          await Service.restoreBackupStatusIfPending(pendingInstance.id, previousStatus);
        } catch (restoreError) {
          // Preserve the original worker/proxy failure for the caller.
          logger.error({ err: restoreError, instanceId: pendingInstance.id }, 'Failed to restore backup status');
        }
      }
      return next(err);
    }
  }
}

export default Instance;
