import jwt from 'jsonwebtoken';
import { Internal, InvalidRequest } from '../errors/index.js';
import Service from '../services/Instance.js';
import WorkerService from '../services/Worker.js';

class Instance {
  static async create(req, res, next) {
    try {
      const { body, user } = req;

      // Verify user plan(future)

      // Get instance data
      const instanceData = { ...body };
      delete instanceData.game;
      const gameData = body?.game || {};

      const instance = await Service.create(user.id, instanceData, gameData);

      return res.status(201).json({ success: true, instance });
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

      return res.status(200).json({ success: true, instance });
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

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const instance = await Service.delete(id);

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async run(req, res, next) {
    try {
      const { id } = req.params;

      const instance = await Service.readOne(id);
      const running = instance?.status === 'running';

      if (running) throw new InvalidRequest('You cannot do this while instance is running!');

      const worker = await WorkerService.readOne(instance.workerId);

      const route = `${worker.url}/server/${id}/run`;
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      if (!response.ok) throw new Internal('Failed the run request to worker!');

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async stop(req, res, next) {
    try {
      const { id } = req.params;

      const instance = await Service.readOne(id);
      const worker = await WorkerService.readOne(instance.workerId);

      const route = `${worker.url}/server/${id}/stop`;
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      if (!response.ok) throw new Internal('Failed the stop request to worker!');

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async restart(req, res, next) {
    try {
      const { id } = req.params;

      const instance = await Service.readOne(id);

      const worker = await WorkerService.readOne(instance.workerId);
      const route = `${worker.url}/server/${id}/restart`;
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      if (!response.ok) throw new Internal('Failed the restart request to worker!');

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async remapPort(req, res, next) {
    try {
      const { id } = req.params;
      const port = await Service.selectPort();
      const instance = await Service.update(id, { port });

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async consoleToken(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;

      const instance = await Service.readOne(id);
      const worker = await WorkerService.readOne(instance.workerId);

      const token = jwt.sign(
        { sub: user.id, instanceId: id, purpose: 'console' },
        worker.secret,
        { expiresIn: 120 },
      );

      return res.status(200).json({ success: true, token, workerUrl: worker.url });
    } catch (err) {
      return next(err);
    }
  }

  static async backup(req, res, next) {
    try {
      const { id } = req.params;

      const instance = await Service.readOne(id);
      const worker = await WorkerService.readOne(instance.workerId);

      const route = `${worker.url}/server/${id}/backup`;
      const response = await fetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify({ instance }),
      });

      if (!response.ok) throw new Internal('Failed the backup request to worker!');

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }
}

export default Instance;
