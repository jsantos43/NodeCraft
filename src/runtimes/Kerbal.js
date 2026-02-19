import Instance from './Instance.js';
import logger from '../../config/logger.js';

class Kerbal extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.setup();
  }

  async setup() {
    try {
      // Run container
      await this.start();

      // Listen container
      this.listen();
    } catch (err) {
      logger.error({ err }, 'Error to setup kerbal instance');
    }
  }
}

export default Kerbal;
