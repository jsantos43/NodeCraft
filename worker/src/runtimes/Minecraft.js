import Path from 'path';
import Instance from './Instance.js';
import query from '../utils/query.js';
import renderTemplate from '../utils/renderTemplate.js';
import logger from '../../config/logger.js';
import FileService from '../services/File.js';

const dashUuid = (id) => id.replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
const xuidToUuid = (xuid) => dashUuid(BigInt(xuid).toString(16).padStart(32, '0'));

class Minecraft extends Instance {
  constructor(instance) {
    super(instance);

    this.paths = {
      allowlist: Path.join(this.path, 'whitelist.json'),
      ops: Path.join(this.path, 'ops.json'),
      properties: Path.join(this.path, 'server.properties'),
      plugins: Path.join(this.path, 'plugins'),
      geyser: Path.join(this.path, 'plugins', 'Geyser-Spigot', 'config.yml'),
      floodgate: Path.join(this.path, 'plugins', 'floodgate', 'config.yml'),
      sessionLock: Path.join(this.path, 'world', 'session.lock'),
      usercache: Path.join(this.path, 'usercache.json'),
    };

    this.state = {
      alive: false,
      onlinePlayers: 0,
      players: [],
      ping: null,
    };

    this.barrier = {
      allowGuests: false,
      needUpdate: false,
      hostGamertags: [],
    };

    this.rosters = [];

    this.setup();
  }

  async wipeAllowlist() {
    try {
      await FileService.createOneFile(this.paths.allowlist, '[]');
      await FileService.delete(this.paths.usercache);
    } catch (err) {
      logger.error({ err }, 'Error to wipe instance allowlist');
    }
  }

  async wipeOpList() {
    try {
      await FileService.createOneFile(this.paths.ops, '[]');
    } catch (err) {
      logger.error({ err }, 'Error to wipe instance ops');
    }
  }

  async sync() {
    const instance = this?.instance;

    try {
      // Sync database with server.properties
      const properties = await renderTemplate('minecraft/server.properties', {
        name: instance.name,
        seed: instance.minecraft.seed,
        gamemode: instance.minecraft.gamemode,
        commandBlock: instance.minecraft.commandBlock,
        secureProfile: instance.minecraft.secureProfile,
        motd: instance.minecraft.motd,
        pvp: instance.minecraft.pvp,
        difficulty: instance.minecraft.difficulty,
        maxPlayers: instance.maxPlayers,
        licensed: instance.minecraft.licensed,
        viewDistance: instance.minecraft.viewDistance,
        nether: instance.minecraft.nether,
        idle: instance.minecraft.idle,
        forceGamemode: instance.minecraft.forceGamemode,
        hardcore: instance.minecraft.hardcore,
        whitelist: instance.minecraft.allowlist,
        enforceWhitelist: instance.minecraft.allowlist,
        npcs: instance.minecraft.npcs,
        animals: instance.minecraft.animals,
        levelType: instance.minecraft.levelType,
        monsters: instance.minecraft.monsters,
        spawn: instance.minecraft.spawn,
      });

      await FileService.createOneFile(this.paths.properties, properties);
    } catch (err) {
      logger.error({ err }, 'Error to sync server.properties');
    }

    try {
      // Ensure bedrock
      if (instance.minecraft.bedrock) {
        const geyser = await renderTemplate('minecraft/geyser.yml', {
          motd: instance.name,
          name: instance.name,
          maxPlayers: instance.maxPlayers,
        });

        const floodgate = await renderTemplate('minecraft/floodgate.yml');

        await FileService.createOneDirectory(this.paths.plugins);
        await FileService.createOneDirectory(Path.dirname(this.paths.geyser));
        await FileService.createOneDirectory(Path.dirname(this.paths.floodgate));

        await FileService.createOneFile(this.paths.geyser, geyser);
        await FileService.createOneFile(this.paths.floodgate, floodgate);
      }
    } catch (err) {
      logger.error({ err }, 'Error to sync geyser and floodgate');
    }
  }

  async removeSessionLock() {
    try {
      await FileService.delete(this.paths.sessionLock);
    } catch (err) {
      logger.error({ err }, 'Error to remove instance session lock');
    }
  }

  async verifyRcon() {
    await this.initRcon(25575, null, async () => {
      await this.sendRcon('gamerule send_command_feedback false');
      await this.sendRcon('gamerule log_admin_commands false');
      await this.sendRcon('save-on');
    });
  }

  async initBarrier() {
    // Wipe allowlist and privilegies
    await this.wipeAllowlist();
    await this.wipeOpList();

    this.rosters = this?.instance?.roster || [];

    await this.makeBarrier(true);
  }

  async makeBarrier(makeOplist = false) {
    this.barrier.hostGamertags = [];

    const allowlist = [];
    const oplist = [];

    // Look for each roster
    for (const roster of this.rosters) {
      if (roster.identifier) {
        // Verify barrier rules
        if (
          (roster.access === 'host' || roster.access === 'member')
          || (roster.access === 'guest' && this.barrier.allowGuests)
        ) {
          if (roster.platform === 'java') {
            // Mojang identifier comes undashed; Minecraft needs the dashed UUID
            const dashedId = dashUuid(roster.identifier);

            // Add roster to allowlist
            allowlist.push({
              uuid: dashedId,
              name: roster.name,
            });

            // Add roster to op list
            if (roster.privileged && makeOplist) {
              oplist.push({
                uuid: dashedId,
                name: roster.name,
                level: 4,
                bypassesPlayerLimit: true,
              });
            }

            // Push roster name to host gamertags
            if (roster.name && roster.access === 'host') {
              this.barrier.hostGamertags.push(roster.name);
            }
          } else if (roster.platform === 'bedrock') {
            // Convert xuid bedrock to uuid java
            const convertedId = xuidToUuid(roster.identifier);

            // Add roster to allowlist
            allowlist.push({
              uuid: convertedId,
              name: `.${roster.name}`,
            });

            // Add roster to op list
            if (roster.privileged && makeOplist) {
              oplist.push({
                uuid: convertedId,
                name: `.${roster.name}`,
                level: 4,
                bypassesPlayerLimit: true,
              });
            }

            // Push roster name to host gamertags
            if (roster.name && roster.access === 'host') {
              this.barrier.hostGamertags.push(`.${roster.name}`);
            }
          }
        }
      }
    }

    // Save allowlist
    await FileService.createOneFile(this.paths.allowlist, JSON.stringify(allowlist));

    // Save oplist
    if (makeOplist === true) {
      await FileService.createOneFile(this.paths.ops, JSON.stringify(oplist));
    }

    // Reload allowlist
    const { sent } = await this.sendRcon('whitelist reload');
    if (sent) this.barrier.needUpdate = false;
  }

  // Review
  async verifyStatus() {
    try {
      const state = await query(this.instance.port);
      const { barrier } = this;

      // Verify if barrier can allow guests
      let allowGuests = false;
      for (const player of state.players) {
        if (barrier.hostGamertags.includes(player.name)) {
          allowGuests = true;
          break;
        }
      }

      // Verify if barrier needs an update
      if (allowGuests !== barrier.allowGuests) {
        barrier.needUpdate = true;
        barrier.allowGuests = allowGuests;
      }

      this.state = {
        alive: state.online,
        onlinePlayers: state.onlinePlayers,
        players: state.players,
        ping: state.ping,
      };
    } catch (err) {
      this.state.alive = false;
      logger.error({ err }, 'Error to update instance state');
    }
  }

  // Review
  async monitor() {
    try {
      // Verify last run
      if (this.checker.lastRun + 500 >= Date.now()) return;

      await this.verifyRcon();
      await this.verifyStatus();
      if (this.barrier.needUpdate && this.state.alive) await this.makeBarrier();

      this.checker.lastRun = Date.now();
    } catch (err) {
      logger.error({ err }, 'Error in instance monitoring!');
    }
  }

  async setup() {
    try {
      // Sync properties files
      await this.sync();

      // Remove session.lock
      await this.removeSessionLock();

      // Set allowlist
      await this.initBarrier();

      // Set monitoring
      this.checker.interval = setInterval(() => this.monitor(), 5000);

      // Start container
      await this.start();

      // listen container
      this.listenStreamEvents((msg) => {
        if (msg.includes('joined the game') || msg.includes('left the game')) {
          this.monitor();
        }
      });
    } catch (err) {
      logger.error({ err }, 'Error to setup minecraft instance');
    }
  }
}

export default Minecraft;
