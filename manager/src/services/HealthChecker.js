import { Op } from 'sequelize';
import { Worker as WorkerModel } from '../models/index.js';
import logger from '../../config/logger.js';

const DEAD_THRESHOLD = 3 * 60 * 1000; // 3 minutes
const CHECK_INTERVAL = 60 * 1000; // 1 minute

class HealthChecker {
  static start() {
    setInterval(HealthChecker.check, CHECK_INTERVAL);

    HealthChecker.check();
  }

  static async check() {
    try {
      const timeoff = Date.now() - DEAD_THRESHOLD;

      await WorkerModel.update(
        { healthy: false },
        {
          where: {
            healthy: true,
            lastSeenAt: { [Op.lt]: timeoff },
          },
        },
      );
    } catch (err) {
      logger.error({ err }, 'Error to verify dead worker!');
    }
  }
}

export default HealthChecker;
