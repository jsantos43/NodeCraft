import { Router } from 'express';
import Controller from '../controllers/File.js';
import verifyPath from '../middlewares/file.js';
import uploader from '../middlewares/uploader.js';
import verifyManager from '../middlewares/manager.js';

const router = Router();

router
  .get( // [Query: path, download]
    '/:id/files',
    verifyManager,
    verifyPath(),
    Controller.read,
  )

  .post( // [Body: type, content | Query: destiny]
    '/:id/files/create',
    verifyManager,
    verifyPath(true),
    Controller.create,
  )

  .post( // [Query: destiny]
    '/:id/files/upload',
    verifyManager,
    verifyPath(true),
    uploader.single('file'),
    Controller.upload,
  )

  .put( // [Body: content | Query: path]
    '/:id/files/edit',
    verifyManager,
    verifyPath(),
    Controller.update,
  )

  .delete( // [Query: path]
    '/:id/files/delete',
    verifyManager,
    verifyPath(),
    Controller.delete,
  )

  .post( // [Query: path, destiny, actions(copy or move)]
    '/:id/files/transfer',
    verifyManager,
    verifyPath(true),
    Controller.transfer,
  )

  .post( // [Query: path, destiny]
    '/:id/files/unzip',
    verifyManager,
    verifyPath(true),
    Controller.unzip,
  );

export default router;
