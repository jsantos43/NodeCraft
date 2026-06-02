import Path from 'path';
import Instance from './Instance.js';
import query from '../utils/query.js';
import renderTemplate from '../utils/renderTemplate.js';
import logger from '../../config/logger.js';
import FileService from '../services/File.js';

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
      allowedGamertags: [],
      superGamertags: [],
      opGamertags: [],
      allowMonitored: false,
      needUpdate: true,
      applyRules: true,
      updating: false,
    };

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

  async wipeOps() {
    try {
      if (!this.rcon) {
        await FileService.createOneFile(this.paths.ops, '[]');
      } else {
        const { result } = await this.sendRcon('op list');
        const opsRaw = result || '';

        const currentOps = opsRaw
          .split(':')[1]
          ?.split(',')
          .map((p) => p.trim())
          .filter(Boolean) || [];

        for (const player of currentOps) {
          await this.sendRcon(`deop ${player}`);
        }
      }
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
        await FileService.createOneDirectory(this.paths.floodgate, floodgate);
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
    this.initRcon(25575, null, async () => {
      await this.sendRcon('gamerule send_command_feedback false');
      await this.sendRcon('gamerule  log_admin_commands false');
      await this.sendRcon('save-all');
      await this.sendRcon('save-on');
    });
  }

  async updateBarrier() {
    try {
      const instancePlain = this.instance;

      // Avoid players kicking while updating
      this.barrier.updating = true;

      // Wipe barrier gamertags
      this.barrier.allowedGamertags = [];
      this.barrier.superGamertags = [];

      const links = instancePlain.players || [];
      for (const link of links) {
        const access = link?.access;
        const gamertags = link.gamertags || [];

        if (access === 'super') {
          this.barrier.allowedGamertags.push(...gamertags);
          this.barrier.superGamertags.push(...gamertags);
        } else if (access === 'always') {
          this.barrier.allowedGamertags.push(...gamertags);
        } else if (access === 'monitored') {
          if (this.barrier.allowMonitored) this.barrier.allowedGamertags.push(...gamertags);
        }

        if (link.privileges) {
          this.barrier.opGamertags.push(...gamertags);
        }
      }

      this.barrier.needUpdate = false;
      this.barrier.updating = false;
      this.barrier.applyRules = true;
    } catch (err) {
      logger.error({ err }, 'Error to update instance barrier');
    }
  }

  async applyBarrier() {
    try {
      if (!this.rcon) return;

      if (this.barrier.applyRules) {
      // Wipe allowlist
        await this.wipeAllowlist();

        // Set allowlist
        for (const gamertag of this.barrier.allowedGamertags) {
          await this.sendRcon(`whitelist add ${gamertag}`);
        }

        // Reload whitelist
        await this.sendRcon('whitelist reload');

        // Wipe privileges
        await this.wipeOps();

        // Set privileges
        for (const gamertag of this.barrier.opGamertags) {
          await this.sendRcon(`op ${gamertag}`);
        }

        this.barrier.applyRules = false;
      }

      if (!this.barrier.updating && this.instance.minecraft.allowlist) {
      // Kick players without authorized gamertag
        for (const player of this.state.players) {
          if (!this.barrier.allowedGamertags.includes(player.name)) {
            await this.sendRcon(`kick ${player.name}`);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to apply instance barrier');
    }
  }

  async updateState() {
    try {
      const state = await query(this.instance.port);
      const { barrier } = this;
      const { superGamertags } = barrier;

      // Verify allow monitored and barrier need update
      let allowMonitored = false;
      for (const player of state.players) {
        if (superGamertags.includes(player.name)) {
          allowMonitored = true;
          break;
        }
      }

      if (allowMonitored !== barrier.allowMonitored) {
        barrier.needUpdate = true;
        barrier.allowMonitored = allowMonitored;
      }

      this.state = {
        alive: state.online,
        onlinePlayers: state.onlinePlayers,
        players: state.players,
        ping: state.ping,
      };
    } catch (err) {
      logger.error({ err }, 'Error to update instance state');
    }
  }

  async newBarrier() {
    try {
      const instance = await this.readFunction();
      this.instance = instance;
      this.barrier.needUpdate = true;
    } catch (err) {
      logger.error({ err }, 'Error to set new instance barrier');
    }
  }

  async monitor() {
    try {
      // Verify last run
      if (this.checker.lastRun + 500 >= Date.now()) return;

      await this.verifyRcon();
      await this.updateState();
      if (this.barrier.needUpdate) await this.updateBarrier();
      await this.applyBarrier();

      this.checker.lastRun = Date.now();
    } catch (err) {
      logger.error({ err }, 'Error in instance monitoring!');
    }
  }

  async setup() {
    try {
      // Wipe allowlist and privilegies
      await this.wipeAllowlist();
      await this.wipeOps();

      // Sync properties files
      await this.sync();

      // Remove session.lock
      this.removeSessionLock();

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
