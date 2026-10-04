import { InvalidRequest } from '../errors/index.js';
import Service from '../services/Instance.js';

const verifyNotRunning = async (req, res, next) => {
  try {
    const id = req?.params?.id;

    const instance = await Service.readOne(id);
    const running = ['running', 'starting'].includes(instance.status);

    if (running) throw new InvalidRequest('You cannot do this while instance is running or starting!');

    return next();
  } catch (err) {
    return next(err);
  }
};

export default verifyNotRunning;
