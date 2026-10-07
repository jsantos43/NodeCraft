import {
  access,
  realpath,
  lstat,
  mkdir,
  stat,
  rm,
  readFile,
  readdir,
  writeFile,
  rename,
  cp,
} from 'node:fs/promises';
import * as unzipper from 'unzipper';
import { createWriteStream } from 'node:fs';
import { pipeline, finished } from 'node:stream/promises';
import Path from 'path';
import archiver from 'archiver';
import logger from '../../config/logger.js';
import config from '../../config/config.js';

import { openInsideInstance, visitInstanceFiles } from '../utils/verifyPaths.js';
import { InvalidRequest } from '../errors/index.js';

const TEMP_LIFETIME = 900000;

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

  // Recursively sum the size of a directory tree, in MB.
  static async getDirSize(path) {
    let bytes = 0;

    await visitInstanceFiles(path, '', async ({ stats }) => {
      if (stats.isFile()) bytes += stats.size;
    });

    return bytes / (1024 * 1024);
  }

  static async readOneFile(path, instancePath = null) {
    if (instancePath) {
      const root = await realpath(instancePath);
      const { handle, stats } = await openInsideInstance(root, path);

      try {
        if (!stats.isFile()) throw new InvalidRequest('The path must be a file!');

        return await handle.readFile('utf8');
      } finally {
        await handle.close();
      }
    }

    try {
      const rawData = await readFile(path, 'utf8');

      return rawData;
    } catch (err) {
      logger.error({ err }, 'Error to read a file');

      return '';
    }
  }

  static async readOneDirectory(path, detailed = false, instancePath = null) {
    if (instancePath) {
      const root = await realpath(instancePath);
      const { handle, stats } = await openInsideInstance(root, path);

      try {
        if (!stats.isDirectory()) throw new InvalidRequest('The path must be a directory!');

        const directory = `/proc/self/fd/${handle.fd}`;
        const items = await readdir(directory);
        if (!detailed) return items;

        const result = [];
        for (const name of items) {
          const child = await openInsideInstance(root, Path.join(directory, name));

          try {
            result.push({ name, type: child.stats.isDirectory() ? 'directory' : 'file' });
          } finally {
            await child.handle.close();
          }
        }
        return result;
      } finally {
        await handle.close();
      }
    }

    try {
      const items = await readdir(path, 'utf8');

      if (!detailed) return items || [];

      const result = [];
      for (const item of items) {
        result.push({
          name: item,
          type: await File.getType(Path.join(path, item)),
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
    const tempPath = Path.join(config.paths.temp, String(timestamp));

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

  static async copy(originPath, destinyPath) {
    try {
      await cp(originPath, destinyPath, { recursive: true });

      return true;
    } catch (err) {
      logger.error({ err }, 'Error to copy paths');

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
      const tempPath = config.paths.temp;

      // Verify if temporary path exists
      if (!(await File.verifyExists(tempPath))) return;

      // Read temporary path items
      const items = await File.readOneDirectory(tempPath);

      // Get timestamp
      const now = Date.now();

      for (const item of items) {
        const createdAt = Number(item);

        if (!Number.isInteger(createdAt) || now - createdAt >= TEMP_LIFETIME) {
          await File.delete(Path.join(tempPath, item));
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error to remove old temp paths');
    }
  }

  static async makeZip(outputPath, paths, instancePath) {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    // Attach immediately: traversal can fail while the output is also failing.
    const completion = pipeline(archive, output);
    completion.catch(() => {});

    try {
      for (const itemPath of paths) {
        // Backup definitions include optional files. Broken links are not missing files.
        try {
          await lstat(itemPath);
        } catch (err) {
          if (err.code === 'ENOENT') continue;
          throw err;
        }

        const prefix = Path.basename(itemPath);
        const relativePath = Path.relative(instancePath, itemPath);
        await visitInstanceFiles(instancePath, relativePath, async ({ handle, stats, name }) => {
          const entryName = Path.join(prefix, name);
          if (stats.isDirectory()) {
            archive.append('', { name: `${entryName}/` });
            return;
          }

          const stream = handle.createReadStream({ autoClose: false });
          try {
            archive.append(stream, { name: entryName });
            await Promise.race([finished(stream), completion]);
          } finally {
            stream.destroy();
          }
        });
      }

      await archive.finalize();
      await completion;
      return outputPath;
    } catch (err) {
      archive.destroy(err);
      output.destroy(err);
      await completion.catch(() => {});
      await rm(outputPath, { force: true });
      throw err;
    }
  }

  static async unzip(fromZip, toPath, instancePath) {
    const root = await realpath(instancePath);
    const { handle, stats } = await openInsideInstance(root, fromZip);

    try {
      if (!stats.isFile()) throw new InvalidRequest('The path must be a ZIP file!');

      const signature = Buffer.alloc(4);
      await handle.read(signature, 0, 4, 0);
      if (!signature.equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
        throw new InvalidRequest('The file is not a ZIP!');
      }

      await File.createOneDirectory(toPath);
      await pipeline(
        handle.createReadStream({ start: 0, autoClose: false }),
        unzipper.Extract({ path: toPath }),
      );

      return true;
    } finally {
      await handle.close();
    }
  }

  static async makeBackup(instance) {
    const instancePath = Path.join(config.paths.instances, String(instance.id));

    const backupPaths = {
      minecraft: [
        Path.join(instancePath, 'world'),
        Path.join(instancePath, 'world_nether'),
        Path.join(instancePath, 'world_the_end'),
        Path.join(instancePath, 'server.properties'),
        Path.join(instancePath, 'spigot.yml'),
        Path.join(instancePath, 'bukkit.yml'),
        Path.join(instancePath, 'config'),
      ],
      terraria: [
        Path.join(instancePath, 'Worlds'),
      ],
      kerbal: [
        Path.join(instancePath, 'Universe'),
        Path.join(instancePath, 'Config'),
      ],
      hytale: [
        Path.join(instancePath, 'universe'),
        Path.join(instancePath, 'config.json'),
      ],
    };

    const paths = backupPaths[instance.type];
    if (!paths) throw new Error(`No backup paths defined for game type: ${instance.type}`);

    const tempPath = await File.createTemp();
    const backupName = `backup-${Date.now()}.zip`;
    const backupPath = Path.join(tempPath, backupName);

    await File.makeZip(backupPath, paths, instancePath);

    const backupSize = await File.getSize(backupPath);

    return { backupPath, backupSize };
  }
}

export default File;
