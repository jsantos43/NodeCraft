import { InvalidRequest } from '../errors/index.js';
import { running } from '../runtimes/index.js';
import handleError from './handleError.js';

class Instance {
  static async verifyRunning(req, res, next) {
    try {
      const id = req?.params?.id;

      const runtime = running[id];
      if (runtime) throw new InvalidRequest('You cannot do this while instance is running!');

      return next();
    } catch (err) {
      return handleError(err, req, res);
    }
  }

  static async verifyNotRunning(req, res, next) {
    try {
      const id = req?.params?.id;

      const runtime = running[id];
      if (!runtime) throw new InvalidRequest('You cannot do this while instance is not running!');

      return next();
    } catch (err) {
      return handleError(err, req, res);
    }
  }
}

export default Instance;
