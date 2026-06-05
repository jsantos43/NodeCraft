import Path from 'path';
import Container from './Container.js';
import Backup from './Backup.js';
import File from './File.js';
import { running, gameRuntimes } from '../runtimes/index.js';
import { Internal } from '../errors/index.js';
import logger from '../../config/logger.js';
import config from '../../config/config.js';
import Manager from './Manager.js';

class Server {
  static async run(instance) {
    try {
      const instancePath = `${config.paths.instances}/${instance.id}`;

      await File.createOneDirectory(instancePath);
      await Container.create(instance);

      const Runtime = gameRuntimes[instance.type];
      if (!Runtime) throw new Internal('Instace game runtime not found!');

      running[instance.id] = new Runtime(instance);
    } catch (err) {
      Server.stop(instance);
      logger.error({ err }, `Error to run instance ${instance?.id}`);
    }
  }

  static async stop(instance) {
    try {
      await Container.stop(instance.id);

      // Stop runtime instance
      if (running[instance.id]) running[instance.id].finish();
      await Container.delete(instance.id);
    } catch (err) {
      logger.error({ err }, `Error to stop instance ${instance?.id}`);
    }
  }

  static async restart(instance) {
    try {
      await Server.stop(instance);
      await Server.run(instance);
    } catch (err) {
      logger.error({ err }, `Error to restart instance ${instance?.id}`);
    }
  }

  // Start instances that were running before worker shutdown
  static async wakeUp() {
    try {
      const instances = await Manager.getInstances();

      for (const instance of instances) {
        try {
          if (instance.status === 'running') {
            await Server.run(instance);
          }
        } catch (err) {
          logger.error({ err }, 'Error to wake up an instance');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to wake up instances');
    }
  }

  static async backupAll() {
    try {
      const instances = await Manager.getInstances();

      for (const instance of instances) {
        try {
          const isRunning = instance.status === 'running';

          await Server.stop(instance);
          await Backup.execute(instance);

          if (isRunning) await Server.run(instance);
        } catch (err) {
          logger.error({ err }, 'Error in an instance maintenance');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to backup all instances');
    }
  }

  static async removeLost(instances) {
    const instancesId = await File.readOneDirectory(config.paths.instances);
    if (!instancesId) return;

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
          const rawData = await File.readOneFile(pendingDelete);
          const data = JSON.parse(rawData);

          const time = Number(data?.time);
          const now = Date.now();

          if (!time || now - time >= INSTANCE_LIFETIME) {
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
