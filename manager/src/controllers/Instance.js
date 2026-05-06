import Service from '../services/Instance.js';
// import BackupService from '../services/Backup.js';

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
      const instance = await Service.run(id);

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async stop(req, res, next) {
    try {
      const { id } = req.params;
      const instance = await Service.stop(id);

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }

  static async restart(req, res, next) {
    try {
      const { id } = req.params;
      await Service.stop(id);
      const instance = await Service.run(id);

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

  static async backup(req, res, next) {
    try {
      const { id } = req.params;

      const instance = await Service.readOne(id);
      // BackupService.execute(instance, true);

      return res.status(200).json({ success: true, instance });
    } catch (err) {
      return next(err);
    }
  }
}

export default Instance;
