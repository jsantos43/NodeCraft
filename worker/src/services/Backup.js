import Path from 'path';
import logger from '../../config/logger.js';
import StorageProvider from '../providers/Storage.js';
import { Internal } from '../errors/index.js';
import env from '../../config/env.js';
import File from './File.js';

class Backup {
  static async verifyAvailableSpace(backupSize) {
    const result = await StorageProvider.getStorageUsage();

    if (backupSize >= result.freeMB) return false;
    return true;
  }

  static async verifyNeeds(id) {
    const ONE_DAY = 23 * 60 * 60 * 1000;
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000 - 300000;

    const info = {
      needDaily: true,
      needWeekly: true,
      doBackup: true,
    };

    const dailyBackups = await StorageProvider.list(`${id}/daily/`);
    if (dailyBackups.length > 0) {
      const lastBackupAge = Date.now() - new Date(dailyBackups[0].LastModified).getTime();
      if (lastBackupAge < ONE_DAY) info.needDaily = false;
    }

    const weeklyBackups = await StorageProvider.list(`${id}/weekly/`);
    if (weeklyBackups.length > 0) {
      for (const backup of weeklyBackups) {
        const age = Date.now() - new Date(backup.LastModified).getTime();
        if (age <= ONE_WEEK) info.needWeekly = false;
      }
    }

    if (!info.needDaily && !info.needWeekly) info.doBackup = false;

    return info;
  }

  static async send({
    id, path, size, daily, weekly,
  }) {
    try {
      const totalSize = (daily && weekly) ? (2 * size) : size;
      const availableSpace = await Backup.verifyAvailableSpace(totalSize);
      if (!availableSpace) throw new Internal('No space available to backups');

      const filename = Path.basename(path);
      if (daily) await StorageProvider.upload(`${id}/daily/${filename}`, path);
      if (weekly) await StorageProvider.upload(`${id}/weekly/${filename}`, path);
    } catch (err) {
      logger.error({ err }, 'Error to send backup');
    }
  }

  static async cleanup(id) {
    await StorageProvider.prune(`${id}/daily/`);
    await StorageProvider.prune(`${id}/weekly/`);
  }

  static async execute(instance, force = false) {
    try {
      if (!env.STORAGE_ENABLE) return;
      if (instance.type === 'counterstrike') return;

      // Verify need backups
      const info = await Backup.verifyNeeds(instance.id);
      if (info.doBackup || force) {
        // Make and send backup to bucket
        const { backupPath, backupSize } = await File.makeBackup(instance);
        await Backup.send({
          id: instance.id,
          path: backupPath,
          size: backupSize,
          daily: info.needDaily || force,
          weekly: info.needWeekly,
        });

        await File.delete(backupPath);
      }

      // Cleanup old backups
      await Backup.cleanup(instance.id);
    } catch (err) {
      logger.error({ err }, 'Error while backuping an instance');
    }
  }
}

export default Backup;
