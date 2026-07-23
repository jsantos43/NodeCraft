import { Router } from 'express';
import Controller from '../controllers/Instance.js';
import file from './file.js';
import link from './link.js';
import roster from './roster.js';
import {
  auth, verifyNotRunning, validate,
} from '../middlewares/index.js';
import {
  createInstance, updateInstance, transferOwner, changeWorker,
} from '../schemas/index.js';

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
  .get(
    '/instance/:id/permissions',
    auth('instance:read'),
    Controller.readPermissions,
  )
  .post(
    '/instance',
    auth('logged'),
    validate(createInstance),
    Controller.create,
  )
  .put(
    '/instance/:id',
    auth('instance:edit'),
    verifyNotRunning,
    validate(updateInstance),
    Controller.update,
  )
  .put(
    '/instance/:id/owner',
    auth('admin'),
    verifyNotRunning,
    validate(transferOwner),
    Controller.transferOwner,
  )
  .put(
    '/instance/:id/worker',
    auth('admin'),
    verifyNotRunning,
    validate(changeWorker),
    Controller.changeWorker,
  )
  .delete(
    '/instance/:id',
    auth('instance:owner'),
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
    auth('instance:console:read'),
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
    auth('instance:owner'),
    verifyNotRunning,
    Controller.remapPort,
  )
  .use('/instance', file)
  .use('/instance', roster)
  .use('/instance', link);

export default router;
