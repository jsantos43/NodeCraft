import {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'fs';
import s3Client from '../../config/storage.js';
import env from '../../config/env.js';

class Storage {
  static async list(prefix) {
    const { Contents } = await s3Client.send(
      new ListObjectsV2Command({ Bucket: env.STORAGE_BUCKET, Prefix: prefix }),
    );

    return Contents || [];
  }

  static async upload(key, path) {
    await s3Client.send(new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
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
      new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
    );
  }

  static async getStorageUsage(prefix = '') {
    const paginatorConfig = { client: s3Client, pageSize: 1000 };
    const commandInput = {
      Bucket: env.STORAGE_BUCKET,
      Prefix: prefix,
    };

    let totalSize = 0;
    let objectCount = 0;

    const paginator = paginateListObjectsV2(paginatorConfig, commandInput);

    for await (const page of paginator) {
      const objects = page.Contents || [];

      // eslint-disable-next-line no-loop-func
      objects.forEach((obj) => {
        totalSize += obj.Size; // Bytes
        objectCount += 1;
      });
    }

    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const maxSpace = env.STORAGE_MAX;
    const freeMB = Number(maxSpace) - Number(sizeMB);

    return {
      count: objectCount,
      sizeBytes: totalSize,
      sizeMB,
      freeMB,
    };
  }

  static async prune(prefix) {
    const objects = await Storage.list(prefix);
    if (objects.length <= 1) return;

    const sortedObjects = objects.sort((a, b) => b.LastModified - a.LastModified);
    const objectsToDelete = sortedObjects.slice(1);

    for (const object of objectsToDelete) {
      await Storage.delete(object.Key);
    }
  }
}

export default Storage;
