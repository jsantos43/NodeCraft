import http from 'http';
import app from './src/app.js';
import config from './config/config.js';
import Maintenance from './src/services/Maintenance.js';
import Server from './src/services/Server.js';
import { initSocket } from './config/socket.js';
import setupWebsocket from './src/websocket/index.js';
import Heartbeat from './src/services/Heartbeat.js';

const server = http.createServer(app);

const io = initSocket(server);
setupWebsocket(io);

server.listen(config.app.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Worker is running on port ${config.app.port}`);

  await Heartbeat.define();
  await Maintenance.ensureEnviroment();
  await Server.wakeUp();
  // Maintenance.scheduleJobs();
});
