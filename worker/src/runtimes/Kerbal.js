import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import FileService from '../services/File.js';

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
      if (!gameData) throw new Error('instance kerbal data not found!');

      // Sync database with Settings.txt
      const kerbalSettings = await renderTemplate('kerbal/Settings.txt', {
        warp: gameData.warp,
        gamemode: gameData.gamemode,
        difficulty: gameData.difficulty,
        allowlist: gameData.allowlist ? 'True' : 'False',
        cheats: gameData.cheats ? 'True' : 'False',
        servername: gameData.servername,
        maxPlayers: instance.maxPlayers,
      });

      await FileService.createOneDirectory(Path.dirname(this.paths.settings));
      await FileService.createOneFile(this.paths.settings, kerbalSettings);
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
      this.listenStreamEvents();
    } catch (err) {
      logger.error({ err }, 'Error to setup kerbal instance');
    }
  }
}

export default Kerbal;
