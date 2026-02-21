import {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import Path from 'path';
import { createReadStream } from 'fs';
import s3Client from '../../config/storage.js';
import config from '../../config/config.js';

class Storage {
  static async list(prefix) {
    const { Contents } = await s3Client.send(
      new ListObjectsV2Command({ Bucket: config.storage.bucket, Prefix: prefix }),
    );

    return Contents || [];
  }

  static async upload(key, path) {
    await s3Client.send(new PutObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
      Body: createReadStream(path),
      Metadata: {
        type: 'full',
        createdAt: new Date().toISOString(),
      },
    }));
  }

  static async delete(key) {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: config.storage.bucket, Key: key }),
    );
  }

  static async deleteOldDailyBackups(id, newBackupKey) {
    const dailyBackups = await Storage.list(`${id}/daily/`);

    for (const backup of dailyBackups) {
      if (backup.Key !== newBackupKey) {
        await Storage.delete(backup.Key);
      }
    }
  }

  // Wipe old weekly backups and verify if need new weekly backup
  static async verifyAndDeleteOldWeeklyBackups(id) {
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000 - 300000;

    const weeklyBackups = await Storage.list(`${id}/weekly/`);

    // Need new weekly backup
    if (weeklyBackups.length === 0) return true;

    // Verify backups ages and wipe olds
    let needWeeklyBackup = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const backup of weeklyBackups) {
      const age = Date.now() - new Date(backup.LastModified).getTime();
      // eslint-disable-next-line no-await-in-loop
      if (age >= ONE_WEEK) await Storage.delete(backup.Key);
      else needWeeklyBackup = false;
    }
    return needWeeklyBackup;
  }

  static async backup(id, localBackupPath) {
    const filename = Path.basename(localBackupPath);
    const dailyBackupKey = `${id}/daily/${filename}`;
    const weeklyBackupKey = `${id}/weekly/${filename}`;

    // Upload daily
    await Storage.upload(dailyBackupKey, localBackupPath);

    // Delete old daily backups
    await Storage.deleteOldDailyBackups(id, dailyBackupKey);

    // Delete old weekly backups and verify if need one
    const needWeeklyBackup = await Storage.verifyAndDeleteOldWeeklyBackups(id);

    // Upload weekly if needed
    if (needWeeklyBackup) await Storage.upload(weeklyBackupKey, localBackupPath);
  }
}

export default Storage;
