import app from './src/app.js';
import config from './config/config.js';
import HealthChecker from './src/services/HealthChecker.js';

app.listen(config.app.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Nodecraft API is running on port ${config.app.port}`);

  HealthChecker.start();
});
