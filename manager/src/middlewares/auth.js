import User from '../services/User.js';
import { Forbidden, Unathorized } from '../errors/index.js';
import Service from '../services/Auth.js';

const auth = (permission) => async (req, res, next) => {
  try {
    // Get id from request
    const id = req?.params?.id || req?.params?.instanceId;

    // Get access token from request
    const token = req?.cookies?.accessToken;

    // Verify if token exists
    if (!token) throw new Unathorized('Invalid Access Token!');

    // Get token payload
    const payload = Service.verifyJWTToken(token);

    // Read only if the token still belongs to the user's current session version.
    const user = await User.readOne(payload.sub, payload.sessionVersion);

    // Save user for next steps
    req.user = user;

    // Check if user has permission
    const authorized = await Service.checkPermission(user, permission, id);
    if (authorized) return next();

    // Throw forbidden error if user is not authorized
    throw new Forbidden(`You need ${permission}!`);
  } catch (err) {
    return next(err);
  }
};

export default auth;
