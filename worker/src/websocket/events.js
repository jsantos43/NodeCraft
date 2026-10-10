import { running } from '../runtimes/index.js';
import Manager from '../services/Manager.js';

const ACCESS_CHECK_INTERVAL = 10000;

const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    let accessCheckTimer;
    let currentAccess = null;

    const checkAccess = async () => {
      try {
        const { token } = socket.handshake.auth;
        const access = await Manager.getConsoleAccess(socket.instanceId, token);

        if (!access.canRead) {
          currentAccess = null;
          socket.disconnect(true);
          return null;
        }

        currentAccess = access;
        return access;
      } catch {
        currentAccess = null;
        socket.disconnect(true);
        return null;
      }
    };

    const pollAccess = async () => {
      await checkAccess();

      if (socket.connected) accessCheckTimer = setTimeout(pollAccess, ACCESS_CHECK_INTERVAL);
    };

    const initialCheck = pollAccess();
    socket.on('disconnect', () => clearTimeout(accessCheckTimer));

    socket.on('join-console', async (payload) => {
      if (!payload || typeof payload !== 'object' || typeof payload.instanceId !== 'string') {
        socket.emit('instance-output', 'Invalid console request.');
        return;
      }

      const { instanceId } = payload;
      if (socket.instanceId !== instanceId) {
        socket.emit('instance-output', 'Not authorized for this instance.');
        return;
      }
      await initialCheck;
      if (!socket.connected) return;
      socket.join(`instance:${instanceId}`);
    });

    socket.on('send-command', async (payload) => {
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
      await initialCheck;
      if (!socket.connected) return;
      if (!currentAccess?.canWrite) {
        socket.emit('instance-output', 'You do not have permission to send commands.');
        return;
      }
      if (running[instanceId]) running[instanceId].sendCommand(command);
    });
  });
};

export default registerSocketEvents;
