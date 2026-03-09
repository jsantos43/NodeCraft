import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import { Internal } from '../errors/index.js';
import FileService from '../services/File.js';

class Hytale extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.paths = {
      instance: this.instancePath,
      settings: Path.join(this.instancePath, 'config.json'),
    };

    this.setup();
  }

  async syncSettings() {
    try {
      const instance = this.instance.get({ plain: true });
      const gameData = instance?.hytale;
      if (!gameData) throw new Internal('instance hytale data not found!');

      // Sync database with Settings.txt
      const hytaleSettings = await renderTemplate('hytale/config.json', {
        servername: gameData.servername,
        motd: gameData.motd,
        password: gameData.password,
        maxPlayers: instance.maxPlayers,
        maxView: gameData.maxView,
        worldname: gameData.worldname,
        gamemode: gameData.gamemode,
      });

      await FileService.createOneFile(this.paths.settings, hytaleSettings);
    } catch (err) {
      logger.error({ err }, 'Error to sync hytale config.json');
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
      logger.error({ err }, 'Error to setup hytale instance');
    }
  }
}

export default Hytale;
