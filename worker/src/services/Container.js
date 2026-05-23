import Path from 'path';
import docker from '../../config/docker.js';
import logger from '../../config/logger.js';
import { Internal } from '../errors/index.js';
import config from '../../config/config.js';

const dockerImages = config.images;

class Container {
  static defineMinecraft(instance, path) {
    const gameData = instance?.minecraft;
    if (!gameData) throw new Error('instance has no minecraft config!');

    const enviroment = [
      'EULA=TRUE',
      'ENABLE_RCON=true',
      'RCON_PASSWORD=nodecraft',
      'RCON_PORT=25575',
      'VERSION=latest',
    ];
    if (gameData.software === 'paper') enviroment.push('TYPE=paper');
    else if (gameData.software === 'purpur') enviroment.push('TYPE=purpur');

    const image = dockerImages.minecraft;
    const binds = [`${path}:/data`];
    const portBindings = {
      '25565/tcp': [
        { HostPort: String(instance.port) },
      ],
      '25565/udp': [
        { HostPort: String(instance.port) },
      ],
    };

    return {
      enviroment,
      binds,
      image,
      portBindings,
    };
  }

  static defineCounterStrike(instance, path) {
    const gameData = instance?.counterstrike;
    if (!gameData) throw new Error('instance has no counterstrike config!');

    const enviroment = [
      `SRCDS_TOKEN=${gameData.steamToken}`,
      `CS2_RCONPW=${gameData.rconPassword}`,
      `CS2_SERVERNAME=${gameData.servername}`,
      `CS2_MAXPLAYERS=${gameData.maxPlayers}`,
      'CS2_SERVER_HIBERNATE=1',
    ];
    if (gameData.password) enviroment.push(`CS2_PW="${gameData.password}"`);

    const image = dockerImages.counterstrike;
    const exposedPorts = {
      '27015/udp': {},
      '27015/tcp': {},
    };
    const binds = [`${path}:/home/steam/cs2-dedicated`];
    const portBindings = {
      '27015/udp': [
        { HostPort: String(instance.port) },
      ],
      '27015/tcp': [
        { HostPort: String(instance.port) },
      ],
    };

    return {
      enviroment,
      binds,
      image,
      portBindings,
      exposedPorts,
    };
  }

  static defineKerbal(instance, path) {
    const image = dockerImages.kerbal;
    const exposedPorts = { '6702/tcp': {} };
    const binds = [
      `${path}/Config:/data/Config`,
      `${path}/Universe:/data/Universe`,
      `${path}/logs:/data/logs`,
    ];
    const portBindings = {
      '6702/tcp': [
        { HostPort: String(instance.port) },
      ],
    };

    return {
      binds,
      image,
      portBindings,
      exposedPorts,
    };
  }

  static async defineHytale(instance, path) {
    const image = dockerImages.hytale;
    const exposedPorts = { '5520/udp': {} };
    const binds = [`${path}:/data`];
    const portBindings = {
      '5520/udp': [
        { HostPort: String(instance.port) },
      ],
    };

    return {
      binds,
      image,
      portBindings,
      exposedPorts,
    };
  }

  static defineTerraria(instance, path) {
    const image = dockerImages.terraria;
    const enviroment = [
      'SERVERCONFIG=1',
    ];
    const exposedPorts = { '7777/tcp': {} };
    const binds = [
      `${path}:/opt/terraria/config/`,
    ];
    const portBindings = {
      '7777/tcp': [
        { HostPort: String(instance.port) },
      ],
    };

    return {
      binds,
      image,
      enviroment,
      portBindings,
      exposedPorts,
    };
  }

  static async create(instance) {
    const existsContainer = await Container.get(instance.id);
    if (existsContainer) return existsContainer;

    const instancePath = Path.join(config.paths.instances, instance.id);
    let info = null;

    switch (instance.type) {
      case 'minecraft':
        info = Container.defineMinecraft(instance, instancePath);
        break;
      case 'counterstrike':
        info = Container.defineCounterStrike(instance, instancePath);
        break;
      case 'kerbal':
        info = Container.defineKerbal(instance, instancePath);
        break;
      case 'hytale':
        info = Container.defineHytale(instance, instancePath);
        break;
      case 'terraria':
        info = Container.defineTerraria(instance, instancePath);
        break;
      default:
        throw new Internal('No container game type available!');
    }

    const container = await docker.createContainer({
      name: `Nodecraft_${instance.id}`,
      Image: info.image,
      Env: info.enviroment,

      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,

      ExposedPorts: info.exposedPorts,

      HostConfig: {
        Binds: info.binds,
        PortBindings: info.portBindings,

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

  static async removeLost(instancesId) {
    try {
      const containers = await docker.listContainers({ all: true });
      for (const container of containers) {
        const name = container.Names?.[0];
        if (!name) continue;

        const cleanName = name.replace(/^\//, '');
        if (!cleanName.startsWith('Nodecraft_')) continue;

        const id = cleanName.replace('Nodecraft_', '');
        if (!instancesId.includes(id)) await Container.delete(id);
      }
    } catch (err) {
      logger.error({ err }, 'Error to remove lost containers');
    }
  }

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
}

export default Container;
