import { Server } from 'socket.io';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');

  return io;
};

export { initSocket, getIO };
