import socketAuth from './auth.js';
import registerSocketEvents from './events.js';

const setupWebsocket = (io) => {
  io.use(socketAuth);
  registerSocketEvents(io);
};

export default setupWebsocket;
