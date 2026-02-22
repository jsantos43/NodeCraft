import fs from 'fs';
import config from '../../config/config.js';
import Container from './Container.js';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import { ensureNetwork, ensureImage } from '../utils/ensureDocker.js';

class Maintenance {
  static async ensureEnviroment() {
    // Ensure default paths
    try {
      if (!fs.existsSync(config.instance.path)) fs.mkdirSync(config.instance.path);
      if (!fs.existsSync(config.temp.path)) fs.mkdirSync(config.temp.path);
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

  static scheduleInstancesMaintenance() {
    // await db.query('VACUUM')
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
        logger.error({ err }, 'Error to maintenance all instances');
      }
    }, config.interval.checkUpdate);
  }

  static scheduleRemoveOldTemp() {
    const removeOldTemp = () => {
      try {
        // Verify if temporary path exists
        if (!fs.existsSync(config.temp.path)) return;

        // Read temporary path items
        const items = fs.readdirSync(config.temp.path);

        // Get timestamp
        const now = Date.now();

        for (const item of items) {
          // Verify if item name is a timestamp
          const createdAt = Number(item);
          if (Number.isInteger(createdAt) && createdAt > 0) {
            if (now - createdAt >= config.temp.lifetime) fs.rmSync(`${config.temp.path}/${item}`, { recursive: true, force: true });
          } else {
            fs.rmSync(`${config.temp.path}/${item}`, { recursive: true, force: true });
          }
        }
      } catch (err) {
        logger.error({ err }, 'Error to remove old temp paths');
      }
    };

    // First run
    removeOldTemp();

    // Set periodically
    setInterval(removeOldTemp, config.interval.checkTemp);
  }

  static scheduleRemoveLostInstances() {
    // First run
    Instance.verifyLost();
    Container.removeLost();

    // Set periodically
    setInterval(() => {
      Instance.verifyLost();
      Container.removeLost();
    }, config.interval.checkLost);
  }

  static scheduleJobs() {
    try {
      Maintenance.scheduleRemoveOldTemp();
      Maintenance.scheduleRemoveLostInstances();
      Maintenance.scheduleInstancesMaintenance();
    } catch (err) {
      logger.error({ err }, 'Error to schedule instances jobs');
    }
  }
}

export default Maintenance;
