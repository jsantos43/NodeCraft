import { Base, mapSequelizeError } from '../errors/index.js';
import logger from '../../config/logger.js';
import config from '../../config/index.js';

// eslint-disable-next-line no-unused-vars
const error = (err, req, res, next) => {
  const sequelizeMappedError = mapSequelizeError(err);
  if (sequelizeMappedError) return sequelizeMappedError.send(res);

  const isAppError = err instanceof Base;
  if (!isAppError) {
    logger.error({
      err,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    }, 'Unhandled internal error');

    // eslint-disable-next-line no-console
    if (config.app.stage === 'DEV') console.error(err);

    return new Base().send(res);
  }

  if (err.status === 500) {
    logger.error({
      err,
    }, 'Internal server error');

    // eslint-disable-next-line no-console
    if (!config.app.stage === 'DEV') console.error(err);
  }

  return err.send(res);
};

export default error;
