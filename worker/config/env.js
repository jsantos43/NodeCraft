import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 9184;
const ABSOLUTE_PATH = path.resolve(process.cwd());
const INSTANCE_PATH = process.env.INSTANCE_PATH || path.join(ABSOLUTE_PATH, 'instances');
const TEMP_PATH = process.env.TEMP_PATH || path.join(ABSOLUTE_PATH, 'temp');
const TEMP_LIFETIME = process.env.TEMP_LIFETIME || 900000;
const STORAGE_ENABLE = process.env.STORAGE_ENABLE;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET;
const STORAGE_REGION = process.env.STORAGE_REGION;
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT;
const STORAGE_FORCE_PATHSTYLE = process.env.STORAGE_FORCE_PATHSTYLE;
const STORAGE_ID = process.env.STORAGE_ID;
const STORAGE_SECRET = process.env.STORAGE_SECRET;
const STORAGE_MAX = process.env.STORAGE_MAX;

export default {
  PORT,
  ABSOLUTE_PATH,
  INSTANCE_PATH,
  TEMP_PATH,
  TEMP_LIFETIME,
  STORAGE_ENABLE,
  STORAGE_BUCKET,
  STORAGE_REGION,
  STORAGE_ENDPOINT,
  STORAGE_FORCE_PATHSTYLE,
  STORAGE_ID,
  STORAGE_SECRET,
  STORAGE_MAX
};