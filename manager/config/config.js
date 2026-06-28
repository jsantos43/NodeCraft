import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    port: process.env.PORT || 9183,
    stage: process.env.STAGE || 'PROD',
  },
  database: {
    enable: process.env.DATABASE_ENABLE || false,
    host: process.env.DATABASE_HOST || null,
    username: process.env.DATABASE_USER || null,
    password: process.env.DATABASE_PASSWORD || null,
    name: process.env.DATABASE_NAME || null,
  },
  email: {
    enable: process.env.EMAIL_ENABLE === 'true',
    host: process.env.EMAIL_HOST || null,
    port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : null,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || null,
    password: process.env.EMAIL_PASSWORD || null,
  },
  site: {
    url: process.env.SITE_URL || null,
    validateUrl: process.env.SITE_VALIDATE_URL || null,
    resetUrl: process.env.SITE_RESET_URL || null,
  },
  token: {
    jwtSecret: '4246e8f9e71b0b086b3b194a4bcb5d07c94dd773dddb51752183f7e9c82c543f',
    accessLifetime: 900000,
    emailLifetime: 86400000,
    resetPasswordLifetime: 1200000,
    refreshLifetime: 259200000,
  },
  instance: {
    path: null,
    maxHistory: 10,
    minPort: 5621,
    maxPort: 5671,
    lifetime: 172800000,
    permissions: [
      'instance:read',
      'instance:update',
      'instance:execute',
      'instance:backup',
      'instance:console',
    ],
  },
};

// Resolve paths
config.absoutePath = path.resolve(process.cwd());

export default Object.freeze(config);
