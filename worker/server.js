import http from 'http';
import app from './src/app.js';
import env from './config/env.js';
// import Maintenance from './src/services/Maintenance.js';
// import Instance from './src/services/Instance.js';
import { initSocket } from './config/socket.js';
import setupWebsocket from './src/websocket/index.js';

const server = http.createServer(app);

const io = initSocket(server);
setupWebsocket(io);

server.listen(env.PORT, async () => {
  console.log(`Worker is running on port ${env.PORT}`)
  // await Maintenance.ensureEnviroment();
  // await Instance.attachAll();
  // Maintenance.scheduleJobs();
});
