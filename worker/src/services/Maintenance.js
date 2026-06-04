import config from '../../config/config.js';
import Container from './Container.js';
import File from './File.js';
import logger from '../../config/logger.js';
import Server from './Server.js';

class Maintenance {
  static async createDefaultPaths() {
    try {
      await File.createOneDirectory(config.paths.instances);
      await File.createOneDirectory(config.paths.temp);
    } catch (err) {
      logger.error({ err }, 'Error to create default paths');
    }
  }

  static async checkDocker() {
    try {
      await Container.ensureNetwork('nodecraft-net');

      for (const [game, image] of Object.entries(config.images)) {
        try {
          await Container.ensureImage(image);
        } catch (err) {
          logger.error({ err }, `Error to ensure docker ${game} image`);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to ensure docker');
    }
  }

  static async ensureEnviroment() {
    await Maintenance.createDefaultPaths();
    await Maintenance.checkDocker();
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

          // Backup all instances function
          await Server.backupAll();
        }
      } catch (err) {
        logger.error({ err }, 'Error in maintenance');
      }
    }, config.interval.checkUpdate);
  }

  static scheduleCleanup() {
    // First run
    Instance.verifyLost();
    Container.removeLost();
    File.removeOldTemp();

    // Set periodically
    setInterval(() => {
      Instance.verifyLost();
      Container.removeLost();
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
