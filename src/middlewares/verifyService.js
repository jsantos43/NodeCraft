import config from '../../config/config.js';
import { InvalidRequest } from '../errors/index.js';
import handleError from './handleError.js';

const verifyService = (service) => (req, res, next) => {
  try {
    if (service === 'email' && !config.email.enable) throw new InvalidRequest('Email service is not set!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

export default verifyService;
