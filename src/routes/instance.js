import { Router } from 'express';
import Controller from '../controllers/Instance.js';
import file from './file.js';
import link from './link.js';
import auth from '../middlewares/auth.js';
import Middleware from '../middlewares/Instance.js';
import validate from '../middlewares/validate.js';
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
    Middleware.verifyRunning,
    validate(updateInstance),
    Controller.update,
  )
  .delete(
    '/instance/:id',
    auth('instance:delete'),
    Middleware.verifyRunning,
    Controller.delete,
  )
  .post(
    '/instance/:id/run',
    auth('instance:execute'),
    Middleware.verifyRunning,
    Controller.run,
  )
  .post(
    '/instance/:id/stop',
    auth('instance:execute'),
    Middleware.verifyNotRunning,
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
    Controller.backup,
  )
  .put(
    '/instance/:id/remap/port',
    auth('instance:update'),
    Middleware.verifyRunning,
    Controller.remapPort,
  )
  .use('/instance', file)
  .use('/instance', link);

export default router;
