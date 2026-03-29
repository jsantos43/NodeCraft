import http from 'http';
import app from './src/app.js';
import config from './config/config.js';
import Maintenance from './src/services/Maintenance.js';
import Instance from './src/services/Instance.js';
import { initSocket } from './config/socket.js';
import setupWebsocket from './src/websocket/index.js';

const server = http.createServer(app);

const io = initSocket(server);
setupWebsocket(io);

server.listen(config.app.port, async () => {
  await Maintenance.ensureEnviroment();
  await Instance.attachAll();
  Maintenance.scheduleJobs();
});
