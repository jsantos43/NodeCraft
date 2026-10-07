import { running } from '../runtimes/index.js';

const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-console', (payload) => {
      if (!payload || typeof payload !== 'object' || typeof payload.instanceId !== 'string') {
        socket.emit('instance-output', 'Invalid console request.');
        return;
      }

      const { instanceId } = payload;
      if (socket.instanceId !== instanceId) {
        socket.emit('instance-output', 'Not authorized for this instance.');
        return;
      }
      if (!socket.permissions.includes('console:read')) {
        socket.emit('instance-output', 'You do not have permission to read the console.');
        return;
      }
      socket.join(`instance:${instanceId}`);
    });

    socket.on('send-command', (payload) => {
      if (!payload || typeof payload !== 'object' || typeof payload.instanceId !== 'string'
        || typeof payload.command !== 'string') {
        socket.emit('instance-output', 'Invalid console request.');
        return;
      }

      const { instanceId, command } = payload;
      if (socket.instanceId !== instanceId) {
        socket.emit('instance-output', 'Not authorized for this instance.');
        return;
      }
      if (!socket.permissions.includes('console:write')) {
        socket.emit('instance-output', 'You do not have permission to send commands.');
        return;
      }
      if (running[instanceId]) running[instanceId].sendCommand(command);
    });
  });
};

export default registerSocketEvents;
