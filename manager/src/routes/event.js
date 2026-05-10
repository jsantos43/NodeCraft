import { Router } from 'express';
import Controller from '../controllers/Worker.js';
import { workerAuth } from '../middlewares/index.js';

const router = Router();

router
  .post(
    '/:id/heartbeat',
    workerAuth(),
    Controller.heartbeat,
  );

export default router;
