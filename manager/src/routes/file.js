import { Router } from 'express';
import Controller from '../controllers/File.js';
import { auth, validate } from '../middlewares/index.js';
import { createFile, updateFile } from '../schemas/index.js';

const router = Router();

router
  .get( // [Query: path, download]
    '/:id/files',
    auth('instance:files:read'),
    Controller.read,
  )

  .post( // [Body: type, content | Query: destiny]
    '/:id/files/create',
    auth('instance:files:write'),
    validate(createFile),
    Controller.create,
  )

  .post( // [Query: destiny]
    '/:id/files/upload',
    auth('instance:files:write'),
    Controller.upload,
  )

  .put( // [Body: content | Query: path]
    '/:id/files/edit',
    auth('instance:files:edit'),
    validate(updateFile),
    Controller.update,
  )

  .delete( // [Query: path]
    '/:id/files/delete',
    auth('instance:files:write'),
    Controller.delete,
  )

  .post( // [Query: path, destiny, actions(copy or move)]
    '/:id/files/transfer',
    auth('instance:files:write'),
    Controller.transfer,
  )

  .post( // [Query: path, destiny]
    '/:id/files/unzip',
    auth('instance:files:write'),
    Controller.unzip,
  );

export default router;
