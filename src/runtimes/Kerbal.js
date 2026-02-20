import fs from 'fs';
import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import { Base } from '../errors/index.js';

class Kerbal extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.paths = {
      instance: this.instancePath,
      settings: Path.join(this.instancePath, 'Config', 'Settings.txt'),
    };

    this.setup();
  }

  async syncSettings() {
    try {
      const instance = this.instance.get({ plain: true });
      const gameData = instance?.kerbal;
      if (!gameData) throw new Base('instance kerbal data not found!');

      // Sync database with Settings.txt
      const kerbalSettings = renderTemplate('kerbal/Settings.txt', {
        warp: gameData.warp.toUpperCase(),
        gamemode: gameData.gamemode.toUpperCase(),
        difficulty: gameData.difficulty.toUpperCase(),
        allowlist: gameData.allowlist ? 'True' : 'False',
        cheats: gameData.cheats ? 'True' : 'False',
        servername: gameData.servername,
        maxPlayers: instance.maxPlayers,
      });

      fs.mkdirSync(Path.dirname(this.paths.settings), { recursive: true });
      fs.writeFileSync(this.paths.settings, kerbalSettings, 'utf8');
    } catch (err) {
      logger.error({ err }, 'Error to sync kerbal Server.txt');
    }
  }

  async setup() {
    try {
      await this.syncSettings();

      // Run container
      await this.start();

      // Listen container
      this.listen();
    } catch (err) {
      logger.error({ err }, 'Error to setup kerbal instance');
    }
  }
}

export default Kerbal;
