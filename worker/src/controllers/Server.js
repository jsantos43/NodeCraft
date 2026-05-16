import Service from '../services/Server.js';

class Server {
  static async run(req, res, next) {
    try {
      console.log('ok', req.body.instance);

      return res.status(200).json({ success: true });
    } catch (err) {
      return next(err);
    }
  }
}

export default Server;
