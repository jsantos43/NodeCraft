import Path from 'path';
import logger from '../../config/logger.js';
import StorageProvider from '../providers/Storage.js';
import File from './File.js';
import config from '../../config/config.js';

const DAILY_RETENTION = 7;
const WEEKLY_RETENTION = 4;

class Backup {
  static async verifyAvailableSpace(backupSize) {
    const result = await StorageProvider.getStorageUsage();

    if (backupSize >= result.freeMB) return false;
    return true;
  }

  static async verifyNeeds(id) {
    const ONE_DAY = 23 * 60 * 60 * 1000;
    const ONE_WEEK = (6 * 24 + 20) * 60 * 60 * 1000;

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
    id, path, daily, weekly,
  }) {
    const filename = Path.basename(path);
    if (daily) await StorageProvider.upload(`${id}/daily/${filename}`, path);
    if (weekly) await StorageProvider.upload(`${id}/weekly/${filename}`, path);
  }

  static async cleanup(id) {
    await StorageProvider.prune(`${id}/daily/`, DAILY_RETENTION);
    await StorageProvider.prune(`${id}/weekly/`, WEEKLY_RETENTION);
  }

  static async execute(instance, force = false) {
    try {
      if (!config.storage.enable) return { status: 'skipped' };
      if (instance.type === 'counterstrike') return { status: 'skipped' };

      // Verify need backups
      const info = await Backup.verifyNeeds(instance.id);

      if (info.doBackup || force) {
        // Make and send backup to bucket
        const { backupPath } = await File.makeBackup(instance);

        await Backup.send({
          id: instance.id,
          path: backupPath,
          daily: info.needDaily || force,
          weekly: info.needWeekly,
        });

        await File.delete(backupPath);
      }

      // Cleanup old backups
      await Backup.cleanup(instance.id);

      return { status: 'success', executedAt: new Date().toISOString() };
    } catch (err) {
      logger.error({ err }, 'Error while backuping an instance');
      return { status: 'failed' };
    }
  }
}

export default Backup;
