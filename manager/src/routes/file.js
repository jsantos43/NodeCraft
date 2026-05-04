import { Router } from 'express';
import Controller from '../controllers/File.js';
import {
  auth,
  uploader,
  verifyPath,
  validate,
  verifyNotRunning,
} from '../middlewares/index.js';
import { createFile, updateFile } from '../schemas/index.js';

const router = Router();

router
  .get( // [Query: path, download]
    '/:id/files',
    auth('instance:file:read'),
    verifyPath(),
    Controller.read,
  )

  .post( // [Body: type, content | Query: destiny]
    '/:id/files/create',
    auth('instance:file:write'),
    verifyPath(true),
    validate(createFile),
    Controller.create,
  )

  .post( // [Query: destiny]
    '/:id/files/upload',
    auth('instance:file:write'),
    verifyPath(true),
    uploader.single('file'),
    Controller.upload,
  )

  .put( // [Body: content | Query: path]
    '/:id/files/edit',
    auth('instance:file:write'),
    verifyNotRunning,
    verifyPath(),
    validate(updateFile),
    Controller.update,
  )

  .delete( // [Query: path]
    '/:id/files/delete',
    auth('instance:file:write'),
    verifyNotRunning,
    verifyPath(),
    Controller.delete,
  )

  .post( // [Query: path, destiny, actions(copy or move)]
    '/:id/files/transfer',
    auth('instance:file:transfer'),
    verifyNotRunning,
    verifyPath(true),
    Controller.transfer,
  )

  .post( // [Query: path, destiny]
    '/:id/files/unzip',
    auth('instance:file:zip'),
    verifyPath(true),
    Controller.unzip,
  );

export default router;
