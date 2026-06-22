import jwt from 'jsonwebtoken';
import config from '../../config/config.js';

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error('Missing token');

    const payload = jwt.verify(token, config.manager.secret);

    if (payload.purpose !== 'console') throw new Error('Invalid token purpose');

    socket.user = { id: payload.sub };
    socket.instanceId = payload.instanceId;

    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
};

export default socketAuth;
