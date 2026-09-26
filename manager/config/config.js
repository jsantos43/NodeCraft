import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

const siteUrl = (process.env.SITE_URL || 'http://localhost:3030').replace(/\/+$/, '');

// Prefix the API is published under by the reverse proxy, as the browser sees
// it. Defaults to the previous hardcoded behaviour: nothing in dev, /api in
// prod. Set it to "/" for an API served at the root — the trailing slash is
// stripped, and an empty value falls back to the default like every other var.
const apiBasePath = (process.env.API_BASE_PATH || (process.env.STAGE === 'DEV' ? '' : '/api'))
  .replace(/\/+$/, '');

const config = {
  app: {
    port: process.env.PORT
      ? Number(process.env.PORT)
      : 9183,
    isDev: process.env.STAGE === 'DEV',
    gmt: process.env.GMT
      ? Number(process.env.GMT)
      : 0,
    siteUrl,
    verifyUrl: `${siteUrl}/verify`,
    resetPasswordUrl: `${siteUrl}/reset`,
    corsOrigins: (process.env.CORS_ORIGIN || siteUrl)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  paths: {
    absolute: path.resolve(process.cwd()),
  },
  log: {
    // pino level: trace | debug | info | warn | error | fatal | silent
    level: process.env.LOG_LEVEL || 'info',
  },
  database: {
    enable: process.env.DATABASE_ENABLE === 'true',
    host: process.env.DATABASE_HOST || null,
    username: process.env.DATABASE_USER || null,
    password: process.env.DATABASE_PASSWORD || null,
    name: process.env.DATABASE_NAME || null,
    poolMax: process.env.DATABASE_POOL_MAX
      ? Number(process.env.DATABASE_POOL_MAX)
      : 20,
    poolAcquire: process.env.DATABASE_POOL_ACQUIRE
      ? Number(process.env.DATABASE_POOL_ACQUIRE)
      : 20 * ONE_SECOND,
    // In seconds (innodb_lock_wait_timeout), unlike every other duration here.
    lockWaitTimeout: process.env.DATABASE_LOCK_WAIT_TIMEOUT
      ? Number(process.env.DATABASE_LOCK_WAIT_TIMEOUT)
      : 10,
  },
  email: {
    enable: process.env.EMAIL_ENABLE === 'true',
    fromName: process.env.EMAIL_FROM_NAME || 'NodeCraft',
    host: process.env.EMAIL_HOST || null,
    port: process.env.EMAIL_PORT
      ? Number(process.env.EMAIL_PORT)
      : null,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || null,
    password: process.env.EMAIL_PASSWORD || null,
  },
  token: {
    jwtSecret: process.env.JWT_SECRET,
    accessLifetime: 15 * ONE_MINUTE,
    emailLifetime: 1 * ONE_DAY,
    resetPasswordLifetime: 20 * ONE_MINUTE,
    refreshLifetime: 3 * ONE_DAY,
    // Path the refresh cookie is scoped to, so it is not sent with every other
    // request. It is the route as the *browser* sees it: the app serves
    // /auth/refresh, and in prod the reverse proxy publishes it under apiBasePath.
    refreshCookiePath: `${apiBasePath}/auth/refresh`,
  },
  instance: {
    games: ['minecraft', 'hytale', 'terraria', 'kerbal'],
    maxHistory: process.env.MAX_HISTORY
      ? Number(process.env.MAX_HISTORY)
      : 50,
    minPort: process.env.MIN_PORT
      ? Number(process.env.MIN_PORT)
      : 5621,
    maxPort: process.env.MAX_PORT
      ? Number(process.env.MAX_PORT)
      : 5671,
    permissions: [
      'instance:read',
      'instance:edit',
      'instance:execute',
      'instance:backup',
      'instance:console:read',
      'instance:console:write',
      'instance:files:read',
      'instance:files:write',
      'instance:files:edit',
      'instance:roster:edit',
    ],
  },
  worker: {
    // Timeout of every manager -> worker request that is not streaming a file.
    timeout: process.env.WORKER_TIMEOUT
      ? Number(process.env.WORKER_TIMEOUT)
      : 15 * ONE_SECOND,
  },
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW
      ? Number(process.env.RATE_LIMIT_WINDOW)
      : 15 * ONE_MINUTE,
    login: process.env.RATE_LIMIT_LOGIN
      ? Number(process.env.RATE_LIMIT_LOGIN)
      : 10,
    createAccount: process.env.RATE_LIMIT_CREATE_ACCOUNT
      ? Number(process.env.RATE_LIMIT_CREATE_ACCOUNT)
      : 5,
    email: process.env.RATE_LIMIT_EMAIL
      ? Number(process.env.RATE_LIMIT_EMAIL)
      : 3,
    trustProxy: process.env.TRUST_PROXY
      ? Number(process.env.TRUST_PROXY)
      : 0,
  },
  roster: {
    access: ['host', 'member', 'guest'],
    platforms: ['java', 'bedrock'],
    platformsByGame: {
      minecraft: ['java', 'bedrock'],
      terraria: [],
    },
  },
};

const deepFreeze = (target) => {
  Object.values(target).forEach((value) => {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) deepFreeze(value);
  });

  return Object.freeze(target);
};

export default deepFreeze(config);
