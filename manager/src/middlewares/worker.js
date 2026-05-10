import Service from '../services/Worker.js';
import { Unathorized } from '../errors/index.js';
import handleError from './handleError.js';

const workerAuth = () => async (req, res, next) => {
  try {
    // Get id from request
    const id = req?.params?.id || req?.params?.workerId;

    // Get worker token from request
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Verify if token exists
    if (!token) throw new Unathorized('Invalid Worker Token!');

    // Get worker
    const worker = await Service.readOne(id);

    // Compare token with api key in the database
    const equalTokens = Service.compareApiKey(token, worker.apiKey);
    if (!equalTokens) throw new Unathorized('Invalid Worker Token!');

    req.worker = worker;
    return next();
  } catch (err) {
    return handleError(err, req, res);
  }
};

export default workerAuth;
