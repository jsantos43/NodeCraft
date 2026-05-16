import { Router } from 'express';
import Controller from '../controllers/Server.js';

const router = Router();

router
  .post('/server/:instanceId/run', Controller.run);

export default router;
