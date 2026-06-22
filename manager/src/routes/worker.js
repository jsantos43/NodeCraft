import { Router } from 'express';
import Controller from '../controllers/Worker.js';
import { auth, workerAuth, workerOrAuth } from '../middlewares/index.js';

const router = Router();

router
  .get(
    '/worker',
    auth('admin'),
    Controller.readAll,
  )
  .get(
    '/worker/:id',
    auth('admin'),
    Controller.readOne,
  )
  .get(
    '/worker/:id/heartbeats',
    auth('admin'),
    Controller.readHeartbeats,
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
    workerOrAuth('admin'),
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
