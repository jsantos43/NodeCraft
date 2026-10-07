import { Router } from 'express';
import Controller from '../controllers/Auth.js';
import {
  auth, verifyService, loginLimiter, refreshLimiter, emailLimiter, validate,
} from '../middlewares/index.js';
import {
  login, validateAccount, forgotPassword, resetPassword,
} from '../schemas/index.js';

const router = Router();

router
  .post(
    '/auth/login',
    loginLimiter,
    validate(login),
    Controller.login,
  )
  .post(
    '/auth/refresh',
    refreshLimiter,
    Controller.refresh,
  )
  .post(
    '/auth/logout',
    auth('logged'),
    Controller.logout,
  )
  .post(
    '/auth/verify',
    verifyService('email'),
    emailLimiter,
    auth('logged'),
    Controller.sendVerification,
  )
  .post(
    '/auth/validate',
    verifyService('email'),
    auth('logged'),
    validate(validateAccount),
    Controller.validateAccount,
  )
  .post(
    '/auth/forgot',
    verifyService('email'),
    emailLimiter,
    validate(forgotPassword),
    Controller.forgotPassword,
  )
  .post(
    '/auth/reset',
    verifyService('email'),
    loginLimiter,
    validate(resetPassword),
    Controller.resetPassword,
  );

export default router;
