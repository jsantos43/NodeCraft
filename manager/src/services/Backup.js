import { Op } from 'sequelize';
import { Worker as WorkerModel, Instance as InstanceModel, instanceInclude } from '../models/index.js';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import proxyFetch, { discardWorkerResponse } from '../utils/proxyFetch.js';

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const TICK_INTERVAL = 15 * ONE_MINUTE;
const BACKUP_HOUR = 3;

// The scheduler's own clock, shifted to the configured GMT offset.
const localDate = (date) => new Date(date.getTime() + config.app.gmt * ONE_HOUR)
  .toISOString()
  .slice(0, 10);

class BackupScheduler {
  static start() {
    // setInterval does not await the callback, so a run that outlives the tick
    // would overlap with the next one and hand the same instances out twice.
    let running = false;

    setInterval(async () => {
      if (running) {
        logger.warn('Previous backup run is still in progress, skipping this tick');

        return;
      }

      running = true;
      try {
        const now = new Date(Date.now() + config.app.gmt * ONE_HOUR);
        if (now.getUTCHours() !== BACKUP_HOUR) return;

        await BackupScheduler.runAll(localDate(new Date()));
      } catch (err) {
        logger.error({ err }, 'Error in backup scheduler tick');
      } finally {
        running = false;
      }
    }, TICK_INTERVAL);
  }

  static async triggerInstanceBackup(worker, instance) {
    const route = `${worker.url}/server/${instance.id}/backup`;

    const response = await proxyFetch(route, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${worker.secret}`,
      },
      body: JSON.stringify({ instance }),
    });

    await discardWorkerResponse(response);

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }
  }

  static async runAll(today = localDate(new Date())) {
    try {
      // scope('withSecret'): triggerInstanceBackup authenticates with it.
      const workers = await WorkerModel.scope('withSecret').findAll({ where: { healthy: true } });

      // Per worker in parallel: one slow machine should not hold up the others.
      await Promise.all(workers.map((worker) => BackupScheduler.runWorker(worker, today)
        .catch((err) => logger.error({ err }, `Error backing up worker ${worker.id}`))));
    } catch (err) {
      logger.error({ err }, 'Error running scheduled backups');
    }
  }

  static async runWorker(worker, today) {
    const oneDayAgo = new Date(Date.now() - ONE_DAY);
    const instances = await InstanceModel.findAll({
      where: {
        workerId: worker.id,
        lastActivityAt: { [Op.gte]: oneDayAgo },
      },
      include: instanceInclude,
    });

    // backupRequestedAt, not lastBackupAt: the worker's backup endpoint returns
    // before the backup runs, so lastBackupAt is still yesterday while the
    // backup is in flight and every later tick of the 3am hour would trigger it
    // again. Being in the database also survives a manager restart.
    const pending = instances.filter(
      (instance) => instance.status !== 'starting'
        && (!instance.backupRequestedAt || localDate(instance.backupRequestedAt) !== today),
    );

    for (const instance of pending) {
      try {
        // Claim first: a trigger that fails is not worth retrying tonight, and
        // claiming after the request would leave the same window open.
        await instance.update({ backupRequestedAt: new Date() });

        await BackupScheduler.triggerInstanceBackup(worker, instance.toJSON());
      } catch (err) {
        logger.error({ err }, `Error triggering scheduled backup for instance ${instance.id}`);
      }
    }
  }
}

export default BackupScheduler;
