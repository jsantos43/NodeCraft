import fs from 'fs';
import Path from 'path';
import renderTemplate from '../utils/renderTemplate.js';
import Instance from './Instance.js';
import logger from '../../config/logger.js';

class CounterStrike extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.paths = {
      instance: this.instancePath,
      cfg: Path.join(this.instancePath, 'game', 'csgo', 'cfg', 'server.cfg'),
    };

    this.setup();
  }

  async sync() {
    const instance = this.instance.get({ plain: true });

    try {
      // Sync database with server.cfg
      const cfg = renderTemplate('counterstrike/server.cfg', {
        hostname: instance.counterstrike.hostname,
        password: instance.counterstrike.password,
        rconPassword: instance.counterstrike.rconPassword,
      });

      fs.writeFileSync(this.paths.cfg, cfg, 'utf8');
    } catch (err) {
      logger.error({ err }, 'Error to sync server.cfg');
    }
  }

  async applyConfig() {
    const instance = this.instance.get({ plain: true });

    const gameModes = {
      casual: { type: 0, mode: 0, cfg: 'gamemode_casual.cfg' },
      competitive: { type: 0, mode: 1, cfg: 'gamemode_competitive.cfg' },
      wingman: { type: 0, mode: 2, cfg: 'gamemode_competitive2v2.cfg' },
      deathmatch: { type: 1, mode: 2, cfg: 'gamemode_deathmatch.cfg' },
    };

    const maps = {
      mirage: { code: 'de_mirage' },
      dust2: { code: 'de_dust2' },
      inferno: { code: 'de_inferno' },
      nuke: { code: 'de_nuke' },
      overpass: { code: 'de_overpass' },
      vertigo: { code: 'de_vertigo' },
      ancient: { code: 'de_ancient' },
      anubis: { code: 'de_anubis' },
      officie: { code: 'cs_office' },
      italy: { code: 'cs_italy' },
      lake: { code: 'de_lake' },
      thistle: { code: 'de_thistle' },
      assembly: { code: 'de_assembly' },
      memento: { code: 'de_memento' },
    };

    const mode = gameModes[instance?.counterstrike?.mode || 'casual'];
    const mapCode = maps[instance?.counterstrike?.map]?.code || 'de_dust2';

    await this.emitEvent(`map ${mapCode}`);
    await this.emitEvent(`game_type ${mode.type}`);
    await this.emitEvent(`game_mode ${mode.mode}`);
    await this.emitEvent(`exec ${mode.cfg}`);
  }

  async setup() {
    // Sync server.cfg file
    await this.sync();

    // Set Rcon monitoring
    const rconPassword = this.instance?.counterstrike?.rconPassword || 'nodecraft';

    this.checker.interval = setInterval(() => {
      this.initRcon(27015, rconPassword, async () => {
        await this.applyConfig();
      });
    }, 5000);

    // Run container
    await this.start();

    // Listen container
    this.listen();
  }
}

export default CounterStrike;
