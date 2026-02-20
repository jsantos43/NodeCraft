import { Router } from 'express';
import Controller from '../controllers/Auth.js';
import auth from '../middlewares/auth.js';
import verifyService from '../middlewares/verifyService.js';

const router = Router();

router
  .post(
    '/auth/login',
    Controller.login,
  )
  .post(
    '/auth/refresh',
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
    auth('logged'),
    Controller.sendVerification,
  )
  .post(
    '/auth/validate',
    verifyService('email'),
    auth('logged'),
    Controller.validateAccount,
  )
  .post(
    '/auth/forgot',
    verifyService('email'),
    Controller.forgotPassword,
  )
  .post(
    '/auth/reset',
    verifyService('email'),
    Controller.resetPassword,
  );

export default router;
