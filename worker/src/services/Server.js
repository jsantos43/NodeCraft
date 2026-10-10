import Path from 'path';
import Container from './Container.js';
import Backup from './Backup.js';
import File from './File.js';
import { running, gameRuntimes } from '../runtimes/index.js';
import { Conflict, Internal } from '../errors/index.js';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import Manager from './Manager.js';

// Instances with a backup in flight. The manager's backup endpoint is
// fire-and-forget, so a second request for the same instance would stop a
// container that is mid-backup and race the restart and the status report.
const backingUp = new Set();
const starting = new Set();

class Server {
  static start(instance, restart = false) {
    if (backingUp.has(instance.id)) throw new Conflict('Instance backup is in progress!');
    if (starting.has(instance.id)) throw new Conflict('Instance is already starting!');

    starting.add(instance.id);

    const operation = restart ? Server.restart(instance) : Server.run(instance);

    const tracked = operation.finally(() => starting.delete(instance.id));

    tracked.catch((err) => logger.error({ err }, `Error to start instance ${instance.id}`));
  }

  static startBackup(instance) {
    if (starting.has(instance.id)) throw new Conflict('Instance is starting!');
    if (backingUp.has(instance.id)) throw new Conflict('Instance backup is already running!');

    const operation = Server.backup(instance);
    operation.catch((err) => logger.error({ err }, `Error to backup instance ${instance.id}`));
  }

  static async run(instance) {
    let runtime;
    try {
      const Runtime = gameRuntimes[instance.type];
      if (!Runtime) throw new Internal('Instance game runtime not found!');

      clearInterval(running[instance.id]?.synchronizer.interval);
      runtime = new Runtime(instance);
      running[instance.id] = runtime;

      const instancePath = `${config.paths.instances}/${instance.id}`;
      await File.createOneDirectory(instancePath);

      const { rconPassword } = await Container.create(instance);

      if (instance.type === 'minecraft') runtime.rconPassword = rconPassword;

      await runtime.setup();
    } catch (err) {
      await Server.stop(instance, false);
      logger.error({ err }, `Error to run instance ${instance?.id}`);
      if (!runtime) {
        await Manager.sendInstanceDetails(instance.id, { status: 'failed' });
        return;
      }
      runtime.status = 'failed';
    }

    // The ordinary report confirms startup, and retries if the manager is unavailable.
    runtime.suppressReports = false;
    running[instance.id] = runtime;
    runtime.synchronizer.interval = setInterval(() => runtime.sendInstanceDetails(), 15000);
  }

  static async stop(instance, report = true) {
    try {
      if (running[instance.id]) running[instance.id].suppressReports = !report;
      await Container.stop(instance.id);

      // Stop runtime instance
      if (running[instance.id]) await running[instance.id].finish();
      await Container.delete(instance.id);
      delete running[instance.id];
    } catch (err) {
      logger.error({ err }, `Error to stop instance ${instance?.id}`);
    }
  }

  static async restart(instance) {
    try {
      await Server.stop(instance, false);
      await Server.run(instance);
    } catch (err) {
      logger.error({ err }, `Error to restart instance ${instance?.id}`);
    }
  }

  static async backup(instance) {
    // Asked before anything else: a backup that was never going to run must not
    // cost the instance a stop/start, and the manager still needs the result.
    const skipReason = Backup.skipReason(instance);
    if (skipReason) {
      logger.info(`Skipping backup for instance ${instance.id}: ${skipReason}`);
      await Manager.reportBackupResult(instance.id, { status: 'skipped' });

      return;
    }

    if (backingUp.has(instance.id)) {
      logger.warn(`Backup for instance ${instance.id} is already running, ignoring the request`);

      return;
    }

    backingUp.add(instance.id);

    const isRunning = instance.status === 'running';
    let result = { status: 'failed' };

    try {
      if (isRunning) await Server.stop(instance, false);

      result = await Backup.execute(instance, true);
    } catch (err) {
      logger.error({ err }, `Error to backup instance ${instance?.id}`);
    } finally {
      try {
        // This restart belongs to the backup, so it may run while backingUp is set.
        if (isRunning) await Server.run(instance);
      } finally {
        try {
          await Manager.reportBackupResult(instance.id, result);
        } finally {
          backingUp.delete(instance.id);
        }
      }
    }
  }

  // Start instances that were running before worker shutdown
  static async wakeUp() {
    try {
      const instances = await Manager.getInstances();

      for (const instance of instances) {
        try {
          if (['running', 'starting'].includes(instance.status)) {
            if (backingUp.has(instance.id) || starting.has(instance.id)) continue;

            starting.add(instance.id);

            try {
              await Server.run(instance);
            } finally {
              starting.delete(instance.id);
            }
          }
        } catch (err) {
          logger.error({ err }, 'Error to wake up an instance');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to wake up instances');
    }
  }

  static async removeLost(instances) {
    if (!Array.isArray(instances)) {
      logger.error('Refusing to mark lost instances without a valid instance list');

      return;
    }

    const instancesId = await File.readOneDirectory(config.paths.instances);
    if (!instancesId) return;

    if (instances.length === 0 && instancesId.length > 0) {
      logger.warn('Marking lost instances against an empty instance list');
    }

    // Instance lifetime as 5 days
    const INSTANCE_LIFETIME = 5 * 24 * 60 * 60 * 1000;

    for (const id of instancesId) {
      try {
        const instancePath = Path.join(config.paths.instances, id);
        const pendingDelete = Path.join(instancePath, '.delete.json');

        const existsPendingDelete = await File.verifyExists(pendingDelete);

        let instanceExists = false;
        for (const instance of instances) {
          if (id === instance.id) instanceExists = true;
        }

        // Verify if instances exists in database and delete pending process and return
        if (instanceExists) {
          await File.delete(pendingDelete);
          continue;
        }

        // Verify if pending delete process exists
        if (existsPendingDelete) {
          // Try to read .delete.json
          const rawData = await File.readOneFile(pendingDelete, instancePath);
          const data = JSON.parse(rawData);

          const time = Number(data?.time);
          const now = Date.now();

          // An unreadable timestamp says nothing about how long the instance has
          // been lost: restart the grace period instead of deleting right away.
          if (!Number.isFinite(time) || time <= 0) {
            await File.createOneFile(pendingDelete, `{"time":${now}}`);
            continue;
          }

          if (now - time >= INSTANCE_LIFETIME) {
            // Delete pending instance
            await File.delete(instancePath);
          }
        } else {
          // Write .delete.json
          await File.createOneFile(pendingDelete, `{"time":${Date.now()}}`);
        }
      } catch (err) {
        logger.error({ err }, 'Error to verify lost instance');
        continue;
      }
    }
  }
}

export default Server;
