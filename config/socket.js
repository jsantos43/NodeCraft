import { Server } from 'socket.io';
import { Internal } from '../src/errors/index.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Internal('Socket.io not initialized!');

  return io;
};

export { initSocket, getIO };
