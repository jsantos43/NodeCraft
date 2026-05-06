import { InvalidRequest } from '../errors/index.js';
// import { running } from '../../../worker/runtimes/index.js';
import handleError from './handleError.js';

const verifyNotRunning = (req, res, next) => {
  try {
    const id = req?.params?.id;

    // const runtime = running[id];
    if (runtime) throw new InvalidRequest('You cannot do this while instance is running!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

const verifyRunning = (req, res, next) => {
  try {
    const id = req?.params?.id;

    // const runtime = running[id];
    if (!runtime) throw new InvalidRequest('You cannot do this while instance is not running!');

    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

export {
  verifyNotRunning,
  verifyRunning,
};
