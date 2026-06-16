import { Router } from 'express';
import Controller from '../controllers/File.js';
import { auth, validate, verifyNotRunning } from '../middlewares/index.js';
import { createFile, updateFile } from '../schemas/index.js';

const router = Router();

router
  .get( // [Query: path, download]
    '/:id/files',
    auth('instance:file:read'),
    Controller.read,
  )

  .post( // [Body: type, content | Query: destiny]
    '/:id/files/create',
    auth('instance:file:write'),
    validate(createFile),
    Controller.create,
  )

  .post( // [Query: destiny]
    '/:id/files/upload',
    auth('instance:file:write'),
    Controller.upload,
  )

  .put( // [Body: content | Query: path]
    '/:id/files/edit',
    auth('instance:file:write'),
    // verifyNotRunning,
    validate(updateFile),
    Controller.update,
  )

  .delete( // [Query: path]
    '/:id/files/delete',
    auth('instance:file:write'),
    // verifyNotRunning,
    Controller.delete,
  )

  .post( // [Query: path, destiny, actions(copy or move)]
    '/:id/files/transfer',
    auth('instance:file:transfer'),
    // verifyNotRunning,
    Controller.transfer,
  )

  .post( // [Query: path, destiny]
    '/:id/files/unzip',
    auth('instance:file:zip'),
    Controller.unzip,
  );

export default router;
