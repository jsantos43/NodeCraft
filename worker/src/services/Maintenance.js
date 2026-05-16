import config from '../../config/config.js';
import Docker from './Docker.js';
import Instance from './Instance.js';
import File from './File.js';
import logger from '../../config/logger.js';
import { ensureNetwork, ensureImage } from '../utils/ensureDocker.js';

class Maintenance {
  static async ensureEnviroment() {
    // Ensure default paths
    try {
      if (!(await File.verifyExists(config.paths.instances))) {
        await File.createOneDirectory(config.paths.instances);
      }

      if (!(await File.verifyExists(config.paths.temp))) {
        await File.createOneDirectory(config.paths.temp);
      }
    } catch (err) {
      logger.error({ err }, 'Error to ensure default paths');
    }

    // Ensure docker
    try {
      await ensureNetwork('nodecraft-net');

      for (const [game, gameSettings] of Object.entries(config.games)) {
        try {
          await ensureImage(gameSettings.image);
        } catch (err) {
          logger.error({ err }, `Error to ensure docker ${game} image`);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to ensure docker');
    }
  }

  static scheduleMaintenance() {
    let lastRunDate = null;

    setInterval(async () => {
      try {
        // Read time
        const now = new Date();
        const isThreeAM = now.getHours() === 3;
        const today = now.toLocaleDateString('sv-SE');

        // Verify if is 3 hour and update was not executed today
        if (isThreeAM && lastRunDate !== today) {
          lastRunDate = today;

          // Update all instances function
          await Instance.maintenanceAll();
        }
      } catch (err) {
        logger.error({ err }, 'Error in maintenance');
      }
    }, config.interval.checkUpdate);
  }

  static scheduleCleanup() {
    // First run
    Instance.verifyLost();
    Docker.removeLost();
    File.removeOldTemp();

    // Set periodically
    setInterval(() => {
      Instance.verifyLost();
      Docker.removeLost();
    }, config.interval.checkLost);

    setInterval(File.removeOldTemp, config.interval.checkTemp);
  }

  static scheduleJobs() {
    try {
      Maintenance.scheduleCleanup();
      Maintenance.scheduleMaintenance();
    } catch (err) {
      logger.error({ err }, 'Error to schedule instances jobs');
    }
  }
}

export default Maintenance;
