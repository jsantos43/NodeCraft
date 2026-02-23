import { Server } from 'socket.io';
import { Base } from '../src/errors/index.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Base('Socket.io not initialized!');

  return io;
};

export { initSocket, getIO };
