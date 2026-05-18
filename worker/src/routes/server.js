import { Router } from 'express';
import Controller from '../controllers/Server.js';
import verifyManager from '../middlewares/manager.js';

const router = Router();

router
  .post(
    '/server/:instanceId/run',
    verifyManager,
    Controller.run,
  )
  .post(
    '/server/:instanceId/stop',
    verifyManager,
    Controller.stop,
  )
  .post(
    '/server/:instanceId/restart',
    verifyManager,
    Controller.restart,
  );

export default router;
