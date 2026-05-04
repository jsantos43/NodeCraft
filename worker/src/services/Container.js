import Path from 'path';
import docker from '../../config/docker.js';
import logger from '../../config/logger.js';
import { Internal } from '../errors/index.js';
import env from '../../config/env.js';

const dockerImages = {
  'minecraft': 'itzg/minecraft-server:latest',
  'counterstrike': 'cm2network/cs2:latest',
  'kerbal': 'ghcr.io/joaosantos2007/ksp:latest',
  'hytale': 'ghcr.io/joaosantos2007/hytale:latest',
  'terraria': 'ghcr.io/passivelemon/terraria-docker:latest',
}

class Container {
  static async create(instance) {
    const existsContainer = await Container.get(instance.id);
    if (existsContainer) return existsContainer;

    const instancePath = Path.join(env.INSTANCE_PATH, instance.id);
    let enviroment = [];
    let binds = [];
    let exposedPorts = {};
    let portBindings = {};
    let image = null;

    if (instance.type === 'minecraft') {
      const gameData = instance?.minecraft;
      if (!gameData) throw new Error('instance has no minecraft config!');

      enviroment = [
        'EULA=TRUE',
        'ENABLE_RCON=true',
        'RCON_PASSWORD=nodecraft',
        'RCON_PORT=25575',
        'VERSION=latest',
      ];
      if (gameData.software === 'paper') enviroment.push('TYPE=paper');
      else if (gameData.software === 'purpur') enviroment.push('TYPE=purpur');

      image = dockerImages.minecraft;
      binds = [`${instancePath}:/data`];
      portBindings = {
        '25565/tcp': [
          { HostPort: String(instance.port) },
        ],
        '25565/udp': [
          { HostPort: String(instance.port) },
        ],
      };
    } else if (instance.type === 'counterstrike') {
      const gameData = instance?.counterstrike;
      if (!gameData) throw new Error('instance has no counterstrike config!');

      enviroment = [
        `SRCDS_TOKEN=${gameData.steamToken}`,
        `CS2_RCONPW=${gameData.rconPassword}`,
        `CS2_SERVERNAME=${gameData.servername}`,
        `CS2_MAXPLAYERS=${gameData.maxPlayers}`,
        'CS2_SERVER_HIBERNATE=1',
      ];
      if (gameData.password) enviroment.push(`CS2_PW="${gameData.password}"`);

      image = dockerImages.counterstrike;
      exposedPorts = {
        '27015/udp': {},
        '27015/tcp': {},
      };
      binds = [`${instancePath}:/home/steam/cs2-dedicated`];
      portBindings = {
        '27015/udp': [
          { HostPort: String(instance.port) },
        ],
        '27015/tcp': [
          { HostPort: String(instance.port) },
        ],
      };
    } else if (instance.type === 'kerbal') {
      image = dockerImages.kerbal;
      exposedPorts = { '6702/tcp': {} };
      binds = [
        `${instancePath}/Config:/data/Config`,
        `${instancePath}/Universe:/data/Universe`,
        `${instancePath}/logs:/data/logs`,
      ];
      portBindings = {
        '6702/tcp': [
          { HostPort: String(instance.port) },
        ],
      };
    } else if (instance.type === 'hytale') {
      image = dockerImages.hytale;
      exposedPorts = { '5520/udp': {} };
      binds = [`${instancePath}:/data`];
      portBindings = {
        '5520/udp': [
          { HostPort: String(instance.port) },
        ],
      };
    } else if (instance.type === 'terraria') {
      image = dockerImages.terraria;
      enviroment = [
        'SERVERCONFIG=1',
      ];
      exposedPorts = { '7777/tcp': {} };
      binds = [
        `${instancePath}:/opt/terraria/config/`,
      ];
      portBindings = {
        '7777/tcp': [
          { HostPort: String(instance.port) },
        ],
      };
    } else {
      throw new Internal('No container game type available!');
    }

    const container = await docker.createContainer({
      name: `Nodecraft_${instance.id}`,
      Image: image,
      Env: enviroment,

      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,

      ExposedPorts: exposedPorts,

      HostConfig: {
        Binds: binds,
        PortBindings: portBindings,

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

  static async removeLost() {
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
}

export default Container;
