import { running } from '../runtimes/index.js';

const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-console', ({ instanceId }) => {
      if (socket.instanceId !== instanceId) {
        socket.emit('instance-output', 'Not authorized for this instance.');
        return;
      }
      socket.join(`instance:${instanceId}`);
    });

    socket.on('send-command', ({ instanceId, command }) => {
      if (socket.instanceId !== instanceId) {
        socket.emit('instance-output', 'Not authorized for this instance.');
        return;
      }
      if (running[instanceId]) running[instanceId].sendCommand(command);
    });
  });
};

export default registerSocketEvents;
