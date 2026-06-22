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

    try {
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
    } catch (err) {
      // A transient storage/list error must never abort a backup. Fall back to
      // taking a daily backup (the important one) and skip weekly to avoid spam.
      logger.error({ err }, 'Error checking backup needs; assuming a daily backup is required');
      return { needDaily: true, needWeekly: false, doBackup: true };
    }

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

      // Cleanup old backups — best-effort: the backup already succeeded, so a
      // transient prune/list failure must not report the whole backup as failed.
      try {
        await Backup.cleanup(instance.id);
      } catch (err) {
        logger.error({ err }, 'Error pruning old backups (backup itself succeeded)');
      }

      return { status: 'success', executedAt: new Date().toISOString() };
    } catch (err) {
      logger.error({ err }, 'Error while backuping an instance');
      return { status: 'failed' };
    }
  }
}

export default Backup;
