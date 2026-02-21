import { S3Client } from '@aws-sdk/client-s3';
import config from './config.js';

const s3Config = {
  endpoint: config.storage.endpoint || undefined,
  forcePathStyle: config.storage.forcePathStyle === 'true',
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
  ...(config.storage.region && { region: config.storage.region }),
};

const s3Client = new S3Client(s3Config);

export default s3Client;
