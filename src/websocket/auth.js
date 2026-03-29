import AuthService from '../services/Auth.js';
import UserService from '../services/User.js';

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('Invalid Access Token!');

    // Get token payload
    const payload = AuthService.verifyJWTToken(token);

    // Get user by token
    const user = await UserService.readOne(payload.sub);

    // eslint-disable-next-line no-param-reassign
    socket.user = user;

    return next();
  } catch (err) {
    return next(err);
  }
};

export default socketAuth;
