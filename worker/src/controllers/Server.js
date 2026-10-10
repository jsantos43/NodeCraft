import Service from '../services/Server.js';

class Server {
  static async run(req, res, next) {
    try {
      const instance = req?.body?.instance;

      Service.start(instance);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async stop(req, res, next) {
    try {
      const instance = req?.body?.instance;

      Service.stop(instance);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async restart(req, res, next) {
    try {
      const instance = req?.body?.instance;

      Service.start(instance, true);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }

  static async backup(req, res, next) {
    try {
      const instance = req?.body?.instance;

      Service.startBackup(instance);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
}

export default Server;
