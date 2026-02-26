import {
  access,
  mkdir,
  stat,
  rm,
  readFile,
  readdir,
  writeFile,
  rename,
  open,
} from 'node:fs/promises';
import * as unzipper from 'unzipper';
import { createWriteStream, createReadStream } from 'node:fs';
import Path from 'path';
import archiver from 'archiver';
import config from '../../config/config.js';
import logger from '../../config/logger.js';

class File {
  static async verifyExists(path) {
    try {
      await access(path);

      return true;
    } catch (err) {
      return false;
    }
  }

  static async getType(path) {
    try {
      const stats = await stat(path);

      if (stats.isFile()) return 'file';
      if (stats.isDirectory()) return 'directory';

      return 'other';
    } catch (err) {
      return null;
    }
  }

  static async getSize(path) {
    try {
      const stats = await stat(path);
      const sizeMb = stats.size / (1024 * 1024);

      return sizeMb;
    } catch (err) {
      logger.error({ err }, 'Error to get path size');

      return 0;
    }
  }

  static async readOneFile(path) {
    try {
      const rawData = await readFile(path, 'utf8');

      return rawData;
    } catch (err) {
      logger.error({ err }, 'Error to read a file');

      return '';
    }
  }

  static async readOneDirectory(path, detailed = false) {
    try {
      const items = await readdir(path, 'utf8');

      if (!detailed) return items || [];

      const result = [];
      for (const item of items) {
        result.push({
          name: item,
          type: File.getType(Path.join(path, item)),
        });
      }

      return result;
    } catch (err) {
      logger.error({ err }, 'Error to read a directory');

      return [];
    }
  }

  static async createTemp() {
    const timestamp = new Date().getTime();
    const tempPath = Path.join(config.temp.path, String(timestamp));

    await File.createOneDirectory(tempPath);
    return tempPath;
  }

  static async createOneFile(path, data) {
    try {
      await writeFile(path, data, 'utf8');

      return true;
    } catch (err) {
      logger.error({ err }, 'Error to create a file');
      return false;
    }
  }

  static async createOneDirectory(path) {
    try {
      await mkdir(path, { recursive: true });

      return true;
    } catch (err) {
      logger.error({ err }, 'Error to create a directory');

      return false;
    }
  }

  static async move(originPath, destinyPath) {
    try {
      await rename(originPath, destinyPath);

      return true;
    } catch (err) {
      logger.error({ err }, 'Error to move paths');

      return false;
    }
  }

  static async delete(path) {
    try {
      await rm(path, { recursive: true, force: true });
    } catch (err) {
      logger.error({ err }, 'Error to delete file');
    }
  }

  static async removeOldTemp() {
    try {
      const tempPath = config.temp.path;

      // Verify if temporary path exists
      if (!(await File.verifyExists(tempPath))) return;

      // Read temporary path items
      const items = await File.readOneDirectory(tempPath);

      // Get timestamp
      const now = Date.now();

      for (const item of items) {
        const createdAt = Number(item);

        if (!Number.isInteger(createdAt) || now - createdAt >= config.temp.lifetime) {
          await File.delete(Path.join(tempPath, item));
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to remove old temp paths');
    }
  }

  static async makeZip(outputPath, paths) {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    // Create promise to monitore stream end
    const streamFinished = new Promise((resolve, reject) => {
      output.on('close', () => resolve(outputPath));
      output.on('error', reject);
      archive.on('error', reject);
    });

    archive.pipe(output);

    for (const itemPath of paths) {
      try {
        const type = await File.getType(itemPath);
        const name = Path.basename(itemPath);

        if (type === 'file') archive.file(itemPath, { name });
        else if (type === 'directory') archive.directory(itemPath, name);
      } catch (err) {
        logger.error({ err }, 'Error to add file in zip');
      }
    }

    await archive.finalize();

    return streamFinished;
  }

  static async verifyZip(path) {
    let file;

    try {
      file = await open(path, 'r');

      const buffer = Buffer.alloc(4);
      await file.read(buffer, 0, 4, 0);

      await file.close();

      // SIGNATURE ZIP: 0x504B0304
      return buffer.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]));
    } catch (err) {
      if (file) await file.close();

      return false;
    }
  }

  static async unzip(fromZip, toPath) {
    try {
      await File.createOneDirectory(toPath);

      // Create the read stream for the .zip file
      const stream = createReadStream(fromZip).pipe(unzipper.Extract({ path: toPath }));

      // Transform the Stream event into a Promise
      return new Promise((resolve, reject) => {
        stream.on('close', () => {
          resolve(true);
        });

        stream.on('error', (err) => {
          logger.error({ err }, 'Error during zip extraction');
          reject(err);
        });
      });
    } catch (err) {
      logger.error({ err }, 'Error configuring unzip');

      return false;
    }
  }

  static async makeBackup(instance) {
    const instancePath = Path.join(config.instance.path, String(instance.id));

    const tempPath = await File.createTemp();
    const backupName = `backup-${Date.now()}.zip`;
    const backupPath = Path.join(tempPath, backupName);

    if (instance.type === 'minecraft') {
      await File.makeZip(backupPath, [
        Path.join(instancePath, 'world'),
        Path.join(instancePath, 'world_nether'),
        Path.join(instancePath, 'world_the_end'),
        Path.join(instancePath, 'server.properties'),
        Path.join(instancePath, 'spigot.yml'),
        Path.join(instancePath, 'bukkit.yml'),
        Path.join(instancePath, 'config'),
      ]);
    } else if (instance.type === 'terraria') {
      await File.makeZip(backupPath, [
        Path.join(instancePath, 'Worlds'),
      ]);
    } else if (instance.type === 'kerbal') {
      await File.makeZip(backupPath, [
        Path.join(instancePath, 'Universe'),
        Path.join(instancePath, 'Config'),
      ]);
    } else if (instance.type === 'hytale') {
      await File.makeZip(backupPath, [
        Path.join(instancePath, 'universe'),
        Path.join(instancePath, 'config.json'),
      ]);
    }

    const backupSize = await File.getSize(backupPath);

    return {
      backupPath,
      backupSize,
    };
  }
}

export default File;
