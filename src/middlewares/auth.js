import User from '../services/User.js';
import { Unathorized } from '../errors/index.js';
import Service from '../services/Auth.js';
import handleError from './handleError.js';

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

    // Get user by token
    const user = await User.readOne(payload.sub);

    // Save user for next steps
    req.user = user;

    // Check if user has permission
    const authorized = await Service.checkPermission(user, permission, id);
    if (authorized) return next();

    // Throw unathorized error if user is not authorized
    throw new Unathorized("You don't have permission to access this route!");
  } catch (err) {
    return handleError(err, req, res);
  }
};

export default auth;
