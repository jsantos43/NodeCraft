import { rateLimit } from 'express-rate-limit';
import config from '../../config/config.js';
import { TooManyRequests } from '../errors/index.js';

const limiter = (max, { skipSuccessfulRequests = false } = {}) => rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: max,
  skipSuccessfulRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => next(new TooManyRequests()),
});

const loginLimiter = limiter(config.rateLimit.login, { skipSuccessfulRequests: true });

const refreshLimiter = limiter(config.rateLimit.login, { skipSuccessfulRequests: true });

const createAccountLimiter = limiter(config.rateLimit.createAccount);

const emailLimiter = limiter(config.rateLimit.email);

export {
  loginLimiter,
  refreshLimiter,
  createAccountLimiter,
  emailLimiter,
};
