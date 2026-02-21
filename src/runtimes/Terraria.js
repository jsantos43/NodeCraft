import fs from 'fs';
import Path from 'path';
import Instance from './Instance.js';
import logger from '../../config/logger.js';
import renderTemplate from '../utils/renderTemplate.js';
import { Base } from '../errors/index.js';

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
      if (!gameData) throw new Base('instance terraria data not found!');

      // Sync database with Settings.txt
      const terrariaSettings = renderTemplate('terraria/serverconfig.txt', {
        maxPlayers: instance.maxPlayers,
        difficulty: gameData.difficulty,
        password: gameData.password,
        motd: gameData.motd,
      });

      fs.writeFileSync(this.paths.settings, terrariaSettings, 'utf8');
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
