import { Unathorized } from '../errors/index.js';
import handleError from './handleError.js';
import config from '../../config/config.js';

const verifyManager = async (req, res, next) => {
  try {
    // Get worker token from request
    const secret = req.headers.authorization?.replace('Bearer ', '');

    // Verify if token exists
    if (!secret) throw new Unathorized('Invalid Manager Secret!');

    if (config.manager.secret !== secret) throw new Unathorized('Invalid Manager Secret!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

export default verifyManager;
