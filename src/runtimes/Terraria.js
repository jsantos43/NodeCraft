import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import { Internal } from '../errors/index.js';
import FileService from '../services/File.js';

class Terraria extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.paths = {
      instance: this.instancePath,
      settings: Path.join(this.instancePath, 'serverconfig.txt'),
    };

    this.setup();
  }

  async syncSettings() {
    try {
      const instance = this.instance.get({ plain: true });
      const gameData = instance?.terraria;
      if (!gameData) throw new Internal('instance terraria data not found!');

      // Sync database with Settings.txt
      const terrariaSettings = await renderTemplate('terraria/serverconfig.txt', {
        maxPlayers: instance.maxPlayers,
        difficulty: gameData.difficulty,
        password: gameData.password,
        motd: gameData.motd,
      });

      await FileService.createOneFile(this.paths.settings, terrariaSettings);
    } catch (err) {
      logger.error({ err }, 'Error to sync terraria serverconfig.txt');
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
      logger.error({ err }, 'Error to setup terraria instance');
    }
  }
}

export default Terraria;
