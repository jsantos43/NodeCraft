import Service from '../services/Worker.js';
import InstanceService from '../services/Instance.js';

class Worker {
  static async readAll(req, res, next) {
    try {
      const workers = await Service.readAll();

      return res.status(200).json({ success: true, workers });
    } catch (err) {
      return next(err);
    }
  }

  static async readOne(req, res, next) {
    try {
      const id = req?.params?.id;
      const worker = await Service.readOne(id);

      return res.status(200).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const body = req?.body;

      const { worker, apiKey } = await Service.create(body);

      return res.status(201).json({
        success: true,
        worker,
        apiKey,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = req?.params?.id;
      const body = req?.body;

      const worker = await Service.update(id, body);

      return res.status(201).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req?.params?.id;
      const worker = await Service.delete(id);

      return res.status(201).json({ success: true, worker });
    } catch (err) {
      return next(err);
    }
  }

  static async heartbeat(req, res, next) {
    try {
      const id = req?.params?.id;
      const body = req?.body;

      await Service.receiveHeartbeat(id, body);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async readInstances(req, res, next) {
    try {
      const id = req?.params?.id;
      const instances = await Service.readInstancesByWorker(id);

      return res.status(200).json({ success: true, instances });
    } catch (err) {
      return next(err);
    }
  }

  static async updateInstance(req, res, next) {
    try {
      const id = req?.params?.instanceId;
      const data = req?.body;

      await InstanceService.update(id, data);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
}

export default Worker;
