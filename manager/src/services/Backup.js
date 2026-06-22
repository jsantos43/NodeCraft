import { Op } from 'sequelize';
import { Worker as WorkerModel, Instance as InstanceModel, instanceInclude } from '../models/index.js';
import logger from '../../config/logger.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

class BackupScheduler {
  static start() {
    let lastRunDate = null;

    setInterval(async () => {
      try {
        const now = new Date();
        const isThreeAM = now.getHours() === 3;
        const today = now.toLocaleDateString('sv-SE');

        if (isThreeAM && lastRunDate !== today) {
          lastRunDate = today;
          await BackupScheduler.runAll();
        }
      } catch (err) {
        logger.error({ err }, 'Error in backup scheduler tick');
      }
    }, FIFTEEN_MINUTES);
  }

  static async triggerInstanceBackup(worker, instance) {
    const route = `${worker.url}/server/${instance.id}/backup`;

    const response = await fetch(route, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${worker.secret}`,
      },
      body: JSON.stringify({ instance }),
    });

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }
  }

  static async runAll() {
    try {
      const workers = await WorkerModel.findAll({ where: { healthy: true } });

      for (const worker of workers) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const instances = await InstanceModel.findAll({
          where: {
            workerId: worker.id,
            lastActivityAt: { [Op.gte]: oneDayAgo },
          },
          include: instanceInclude,
        });

        for (const instance of instances) {
          try {
            await BackupScheduler.triggerInstanceBackup(worker, instance.toJSON());
          } catch (err) {
            logger.error({ err }, `Error triggering scheduled backup for instance ${instance.id}`);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error running scheduled backups');
    }
  }
}

export default BackupScheduler;
