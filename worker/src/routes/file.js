import { Router } from 'express';
import Controller from '../controllers/File.js';
import verifyPath from '../middlewares/file.js';

const router = Router();

router
  .get( // [Query: path, download]
    '/:id/files',
    verifyPath(),
    Controller.read,
  )

  .post( // [Body: type, content | Query: destiny]
    '/:id/files/create',
    verifyPath(true),
    Controller.create,
  )

  // .post( // [Query: destiny]
  //   '/:id/files/upload',
  //   verifyPath(true),
  //   uploader.single('file'),
  //   Controller.upload,
  // )

  .put( // [Body: content | Query: path]
    '/:id/files/edit',
    verifyPath(),
    Controller.update,
  )

  .delete( // [Query: path]
    '/:id/files/delete',
    verifyPath(),
    Controller.delete,
  )

  .post( // [Query: path, destiny, actions(copy or move)]
    '/:id/files/transfer',
    verifyPath(true),
    Controller.transfer,
  )

  .post( // [Query: path, destiny]
    '/:id/files/unzip',
    verifyPath(true),
    Controller.unzip,
  );

export default router;
