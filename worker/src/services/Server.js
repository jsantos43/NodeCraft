import Path from 'path';
import Container from './Container.js';
import Backup from './Backup.js';
import File from './File.js';
import { running, gameRuntimes } from '../runtimes/index.js';
import logger from '../../config/logger.js';

class Server {
  static async run(instance) {
    await Container.create(instance);

    try {
      const Runtime = gameRuntimes[instance.type];
      if (!Runtime) throw new Internal('Instace game runtime not found!');

      running[id] = new Runtime(instance, () => Instance.readOne(id));
      await instance.update({ status: 'running' });
    } catch (err) {
      await Instance.stop(id);

      throw err;
    }

    return instance;
  }

  static async stop(id) {
    const instance = await Instance.readOne(id);
    await Container.stop(id);

    // Stop runtime instance
    if (running[id]) running[id].finish();
    delete running[id];
    await Container.delete(id);

    await instance.update({ status: 'stopped' });
    return instance;
  }

  static async maintenanceAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        const isRunning = instance.status === 'running';

        await Instance.stop(instance.id);

        await Backup.execute(instance);

        if (isRunning) await Instance.run(instance.id);
      } catch (err) {
        logger.error({ err }, 'Error in an instance maintenance');
      }
    }
  }

  static async attachAll() {
    const instances = await Instance.readAll();

    for (const instance of instances) {
      try {
        if (instance.status === 'running') await Instance.run(instance.id);
      } catch (err) {
        logger.error({ err }, 'Error to attach an instance');
      }
    }
  }

  static async verifyLost() {
    const instancesId = await File.readOneDirectory(config.instance.path);
    if (!instancesId) return;

    for (const id of instancesId) {
      try {
        const instancePath = Path.join(config.instance.path, id);
        const pendingDeletePath = Path.join(instancePath, '.delete-pending.json');
        const existsPendingDelete = await File.verifyExists(pendingDeletePath);

        // Verify if instances exists in database, delete pending process and return
        try {
          const instance = await Model.findByPk(id);
          if (instance) {
            await File.delete(pendingDeletePath);
            continue;
          }
        } catch (err) {
          continue;
        }

        // Verify if pending delete process exists
        if (existsPendingDelete) {
          // Try to read .delete-pending.json
          const rawData = await File.readOneFile(pendingDeletePath);
          const data = JSON.parse(rawData);

          const time = Number(data?.time);
          const now = Date.now();

          if (!time || now - time >= config.instance.lifetime) {
            // Delete pending instance
            await File.delete(instancePath);
          }
        } else {
          // Write .delete-pending.json
          await File.createOneFile(pendingDeletePath, `{"time":${Date.now()}}`);
        }
      } catch (err) {
        logger.error({ err }, 'Error to verify lost instance');
        continue;
      }
    }
  }
}

export default Server;
