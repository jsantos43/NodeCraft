import Path from 'path';
import docker from '../../config/docker.js';
import config from '../../config/index.js';
import InstanceModel from '../models/Instance.js';
import logger from '../../config/logger.js';

class Container {
  static ensureImage(imageName) {
    return new Promise((resolve, reject) => {
      docker.getImage(imageName).inspect()
        .then(() => resolve())
        .catch(() => {
          docker.pull(imageName, (err, stream) => {
            if (err) return reject(err);

            return docker.modem.followProgress(
              stream,
              (errProgress) => (errProgress ? reject(errProgress) : resolve()),
            );
          });
        });
    });
  }

  static async ensureNetwork(networkName) {
    const networks = await docker.listNetworks();

    let exists = false;
    networks.forEach((net) => {
      if (net.Name === networkName) exists = true;
    });

    if (exists) return;

    await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
      Internal: false,
      Attachable: false,
    });
  }

  static async create(instance) {
    const existsContainer = await Container.get(instance.id);
    if (existsContainer) return existsContainer;

    let container = null;
    if (instance.type === 'minecraft') container = await Container.createMinecraft(instance);
    if (instance.type === 'counterstrike') container = await Container.createCounterStrike(instance);

    return container;
  }

  static async get(id) {
    try {
      const container = docker.getContainer(`Nodecraft_${id}`);
      await container.inspect();

      return container;
    } catch {
      return null;
    }
  }

  static async getIpAddress(id) {
    try {
      const container = await Container.get(id);
      const inspect = await container.inspect();
      const network = inspect.NetworkSettings.Networks['nodecraft-net'];

      return network.IPAddress;
    } catch {
      return '';
    }
  }

  static async delete(id) {
    try {
      const container = await Container.get(id);
      if (!container) return;

      await container.remove({ force: true });
    } catch (err) {
      logger.error({ err }, 'Error to delete docker container');
    }
  }

  static async run(id) {
    try {
      // Read container
      const container = await Container.get(id);
      if (!container) return;

      // Get container info
      const info = await container.inspect();
      const isRunning = info.State.Running;

      if (!isRunning) await container.start();
    } catch (err) {
      logger.error({ err }, 'Error to start container');
    }
  }

  static async stop(id) {
    try {
      // Read container
      const container = await Container.get(id);
      if (!container) return;

      // Get container info
      const info = await container.inspect();
      const isRunning = info.State.Running;

      // Stop container
      if (isRunning) {
        try {
          await container.stop({ t: 20 }); // SIGTERM
        } catch {
          await container.kill(); // SIGKILL
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to stop container');
    }
  }

  static async removeLostContainers() {
    try {
      const instances = await InstanceModel.findAll({
        attributes: ['id'],
        raw: true,
      }) || [];
      const instancesId = [];
      for (const instance of instances) {
        instancesId.push(instance.id);
      }

      const containers = await docker.listContainers({ all: true });
      for (const container of containers) {
        const name = container.Names?.[0];
        if (!name) continue;

        const cleanName = name.replace(/^\//, '');
        if (!cleanName.startsWith('Nodecraft_')) continue;

        const instanceId = cleanName.replace('Nodecraft_', '');
        if (!instancesId.includes(instanceId)) {
          await Container.delete(instanceId);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to remove lost containers');
    }
  }

  static async createMinecraft(instance) {
    const instancePath = Path.join(config.instance.path, instance.id);
    await Container.ensureImage('itzg/minecraft-server');
    await Container.ensureNetwork('nodecraft-net');

    const enviroment = [
      'EULA=TRUE',
      'ENABLE_RCON=true',
      'RCON_PASSWORD=nodecraft',
      'RCON_PORT=25575',
    ];

    if (instance.minecraft.software === 'paper') {
      enviroment.push('TYPE=paper');
      enviroment.push('VERSION=latest');

      if (instance.minecraft.bedrock) {
        enviroment.push(`PLUGINS=${config.minecraft.geyser},${config.minecraft.floodgate}`);
      }
    }

    if (instance.minecraft.software === 'purpur') {
      enviroment.push('TYPE=purpur');
      enviroment.push('VERSION=latest');

      if (instance.minecraft.bedrock) {
        enviroment.push(`PLUGINS=${config.minecraft.geyser},${config.minecraft.floodgate}`);
      }
    }

    const container = await docker.createContainer({
      name: `Nodecraft_${instance.id}`,
      Image: 'itzg/minecraft-server',
      Env: enviroment,

      HostConfig: {
        Binds: [`${instancePath}:/data`],
        PortBindings: {
          '25565/tcp': [
            { HostPort: String(instance.port) },
          ],
          '25565/udp': [
            { HostPort: String(instance.port) },
          ],
        },

        NetworkMode: 'nodecraft-net',
        Memory: instance.memory * 1024 * 1024,
        NanoCpus: instance.cpu * 1e9,

        // Secure
        // ReadonlyRootfs: true,
        // CapDrop: ['ALL'],
        RestartPolicy: { Name: 'no' },
        SecurityOpt: ['no-new-privileges'],
      },
    });

    return container;
  }

  static async createCounterStrike(instance) {
    const instancePath = Path.join(config.instance.path, instance.id);
    await Container.ensureImage('cm2network/cs2:latest');
    await Container.ensureNetwork('nodecraft-net');

    const enviroment = [
      `SRCDS_TOKEN=${instance?.counterstrike?.steamToken}`,
      `CS2_RCONPW=${instance?.counterstrike?.rconPassword}`,
    ];

    const container = await docker.createContainer({
      name: `Nodecraft_${instance.id}`,
      Image: 'cm2network/cs2',
      Env: enviroment,

      ExposedPorts: {
        '27015/udp': {},
        '27015/tcp': {},
      },

      HostConfig: {
        Binds: [
          `${instancePath}:/home/steam/cs2-dedicated`,
        ],

        PortBindings: {
          '27015/udp': [
            { HostPort: String(instance.port) },
          ],
          '27015/tcp': [
            { HostPort: String(instance.port) },
          ],
        },

        NetworkMode: 'nodecraft-net',
        Memory: instance.memory * 1024 * 1024,
        NanoCpus: instance.cpu * 1e9,
        RestartPolicy: {
          Name: 'unless-stopped',
        },
      },
    });

    return container;
  }
}

export default Container;
