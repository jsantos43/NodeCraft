import { Router } from 'express';
import Controller from '../controllers/Instance.js';
import file from './file.js';
import link from './link.js';
import {
  auth, verifyNotRunning, validate,
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
    verifyNotRunning,
    validate(updateInstance),
    Controller.update,
  )
  .delete(
    '/instance/:id',
    auth('instance:delete'),
    verifyNotRunning,
    Controller.delete,
  )
  .post(
    '/instance/:id/run',
    auth('instance:execute'),
    Controller.run,
  )
  .post(
    '/instance/:id/stop',
    auth('instance:execute'),
    Controller.stop,
  )
  .post(
    '/instance/:id/restart',
    auth('instance:execute'),
    Controller.restart,
  )
  .post(
    '/instance/:id/console',
    auth('instance:console'),
    Controller.consoleToken,
  )
  .post(
    '/instance/:id/backup',
    auth('instance:backup'),
    verifyNotRunning,
    Controller.backup,
  )
  .put(
    '/instance/:id/remap',
    auth('instance:update'),
    verifyNotRunning,
    Controller.remapPort,
  )
  .use('/instance', file)
  .use('/instance', link);

export default router;
