import Instance from './Instance.js';
import logger from '../../config/logger.js';
import config from '../../config/config.js';

class CounterStrike extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.setup();
  }

  async applyConfig() {
    try {
      const instance = this.instance.get({ plain: true });
      const counterstrike = instance?.counterstrike;
      if (!counterstrike) return;

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

      const mode = gameModes[counterstrike.mode || 'casual'];
      const mapCode = maps[counterstrike.map]?.code || 'de_dust2';

      await this.sendRcon(`map ${mapCode}`);
      await this.sendRcon(`game_type ${mode.type}`);
      await this.sendRcon(`game_mode ${mode.mode}`);
      await this.sendRcon(`exec ${mode.cfg}`);
      await this.sendRcon(`bot_difficulty ${counterstrike.botDifficulty}`);
      await this.sendRcon(`bot_quota ${counterstrike.botQuota}`);
      await this.sendRcon(`bot_quota_mode ${counterstrike.botMode}`);
    } catch (err) {
      logger.error({ err }, 'Error to apply cs config');
    }
  }

  async setup() {
    try {
      // Set Rcon monitoring
      const rconPassword = this.instance?.counterstrike?.rconPassword || 'nodecraft';

      this.checker.interval = setInterval(() => {
        this.initRcon(27015, rconPassword, async () => {
          await this.applyConfig();
        });
      }, config.games.counterstrike.checkTime);

      // Run container
      await this.start();

      // Listen container
      this.listen();
    } catch (err) {
      logger.error({ err }, 'Error to setup counterstrike instance');
    }
  }
}

export default CounterStrike;
