import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const absoutePath = path.resolve(process.cwd());

const config = {
  app: {
    port: process.env.PORT || 9184,
    stage: process.env.STAGE || 'PROD',
    id: process.env.WORKER_ID,
  },
  paths: {
    absolute: absoutePath,
    instances: process.env.INSTANCE_PATH || path.join(absoutePath, 'instances'),
    temp: process.env.TEMP_PATH || path.join(absoutePath, 'temp'),
  },
  manager: {
    url: process.env.MANAGER_URL,
    apiKey: process.env.MANAGER_API_KEY,
    secret: process.env.MANAGER_SECRET,
  },
  storage: {
    enable: process.env.STORAGE_ENABLE,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    endpoint: process.env.STORAGE_ENDPOINT,
    forcePathStyle: process.env.STORAGE_FORCE_PATHSTYLE,
    id: process.env.STORAGE_ID,
    secret: process.env.STORAGE_SECRET,
    max: process.env.STORAGE_MAX,
  },
};

export default Object.freeze(config);
