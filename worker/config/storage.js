import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

const s3Config = {
  endpoint: env.STORAGE_ENDPOINT || undefined,
  forcePathStyle: env.STORAGE_FORCE_PATHSTYLE === 'true',
  credentials: {
    accessKeyId: env.STORAGE_ID,
    secretAccessKey: env.STORAGE_SECRET,
  },
  ...(env.STORAGE_REGION && { region: env.STORAGE_REGION }),
};

const s3Client = new S3Client(s3Config);

export default s3Client;
