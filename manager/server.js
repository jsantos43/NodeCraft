import app from './src/app.js';
import config from './config/config.js';
import BackupScheduler from './src/services/Backup.js';
import Worker from './src/services/Worker.js';

app.listen(config.app.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Nodecraft API is running on port ${config.app.port}`);

  Worker.startChecker();
  BackupScheduler.start();
});
