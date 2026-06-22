import Service from '../services/Worker.js';
import { Unathorized } from '../errors/index.js';
import handleError from './handleError.js';
import auth from './auth.js';

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

// Dual-use routes: allow either a valid worker API key (worker → manager)
// or an authenticated user with `permission` (frontend → manager).
const workerOrAuth = (permission) => async (req, res, next) => {
  const id = req?.params?.id || req?.params?.workerId;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Try worker API key first; fall back to user auth on any mismatch.
  if (token && id) {
    try {
      const worker = await Service.readOne(id);
      if (Service.compareApiKey(token, worker.apiKey)) {
        req.worker = worker;
        return next();
      }
    } catch {
      // worker not found / lookup failed — defer to user auth below
    }
  }

  return auth(permission)(req, res, next);
};

export { workerOrAuth };
export default workerAuth;
