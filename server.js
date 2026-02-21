import app from './src/app.js';
import config from './config/config.js';
import Maintenance from './src/services/Maintenance.js';
import Instance from './src/services/Instance.js';

app.listen(config.app.port, async () => {
  await Maintenance.ensureEnviroment();
  await Instance.attachAll();
  Maintenance.scheduleJobs();
});
