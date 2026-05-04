// import AuthService from '../../../manager/src/services/Auth.js';
import { running } from '../runtimes/index.js';

const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-console', async ({ instanceId }) => {
      const authorized = await AuthService.checkPermission(socket.user, 'instance:console', instanceId);

      if (authorized) {
        socket.join(`instance:${instanceId}`);
      } else {
        socket.emit('instance-output', 'You are not authorized to access this instance console!');
      }
    });

    socket.on('send-command', async ({ instanceId, command }) => {
      const authorized = await AuthService.checkPermission(socket.user, 'instance:console', instanceId);

      if (authorized) {
        if (running[instanceId]) running[instanceId].sendCommand(command);
      } else {
        socket.emit('instance-output', 'You are not authorized to access this instance console!');
      }
    });
  });
};

export default registerSocketEvents;
