import { Router } from 'express';
import Controller from '../controllers/Instance.js';
import file from './file.js';
import link from './link.js';
import {
  auth, verifyRunning, verifyNotRunning, validate,
} from '../middlewares/index.js';
import { createInstance, updateInstance } from '../schemas/index.js';

const router = Router();

router
  .get(
    '/instance',
    auth('logged'),
    Controller.readAll,
  )
  .get(
    '/instance/:id',
    auth('instance:read'),
    Controller.readOne,
  )
  .post(
    '/instance',
    auth('logged'),
    validate(createInstance),
    Controller.create,
  )
  .put(
    '/instance/:id',
    auth('instance:update'),
    verifyRunning,
    validate(updateInstance),
    Controller.update,
  )
  .delete(
    '/instance/:id',
    auth('instance:delete'),
    verifyRunning,
    Controller.delete,
  )
  .post(
    '/instance/:id/run',
    auth('instance:execute'),
    verifyRunning,
    Controller.run,
  )
  .post(
    '/instance/:id/stop',
    auth('instance:execute'),
    verifyNotRunning,
    Controller.stop,
  )
  .post(
    '/instance/:id/restart',
    auth('instance:execute'),
    Controller.restart,
  )
  .post(
    '/instance/:id/backup',
    auth('instance:backup'),
    verifyRunning,
    Controller.backup,
  )
  .put(
    '/instance/:id/remap/port',
    auth('instance:update'),
    verifyRunning,
    Controller.remapPort,
  )
  .use('/instance', file)
  .use('/instance', link);

export default router;
