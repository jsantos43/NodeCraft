import app from './src/app.js';
import config from './config/config.js';

app.listen(config.app.port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Nodecraft API working on port ${config.app.port}`);
});
