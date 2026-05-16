import { InvalidRequest } from '../errors/index.js';
import Service from '../services/Instance.js';
import handleError from './handleError.js';

const verifyNotRunning = async (req, res, next) => {
  try {
    const id = req?.params?.id;

    const instance = await Service.readOne(id);
    const running = instance.status === 'running';

    if (running) throw new InvalidRequest('You cannot do this while instance is running!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

const verifyRunning = async (req, res, next) => {
  try {
    const id = req?.params?.id;

    const instance = await Service.readOne(id);
    const running = instance.status === 'running';

    if (!running) throw new InvalidRequest('You cannot do this while instance is not running!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

export {
  verifyNotRunning,
  verifyRunning,
};
