import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import FileService from '../services/File.js';

class Terraria extends Instance {
  constructor(instance, readFunction) {
    super(instance, readFunction);

    this.paths = {
      settings: Path.join(this.path, 'serverconfig.txt'),
    };
  }

  async syncSettings() {
    try {
      const gameData = this.instance?.terraria;
      if (!gameData) throw new Error('instance terraria data not found!');

      // Sync database with Settings.txt
      const terrariaSettings = await renderTemplate('terraria/serverconfig.txt', {
        maxPlayers: this.instance.maxPlayers,
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
      this.listenStreamEvents();
    } catch (err) {
      logger.error({ err }, 'Error to setup terraria instance');
      throw err;
    }
  }
}

export default Terraria;
