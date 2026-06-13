import { Router } from 'express';
import Controller from '../controllers/Worker.js';
import { auth, workerAuth } from '../middlewares/index.js';

const router = Router();

router
  .get(
    '/worker',
    // auth('admin'),
    Controller.readAll,
  )
  .get(
    '/worker/:id',
    // auth('admin'),
    Controller.readOne,
  )
  .post(
    '/worker',
    auth('admin'),
    Controller.create,
  )
  .put(
    '/worker/:id',
    auth('admin'),
    Controller.update,
  )
  .delete(
    '/worker/:id',
    auth('admin'),
    Controller.delete,
  )
  .post(
    '/worker/:id/heartbeat',
    workerAuth(),
    Controller.heartbeat,
  )
  .get(
    '/worker/:id/instances',
    workerAuth(),
    Controller.readInstances,
  )
  .put(
    '/worker/:workerId/instances/:instanceId',
    workerAuth(),
    Controller.updateInstance,
  )
  .put(
    '/worker/:workerId/instances/:instanceId/backup',
    workerAuth(),
    Controller.reportBackupResult,
  );

export default router;
