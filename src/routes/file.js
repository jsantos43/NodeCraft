import { Router } from 'express';
import Controller from '../controllers/File.js';
import Middleware from '../middlewares/File.js';
import InstanceMiddleware from '../middlewares/Instance.js';
import auth from '../middlewares/auth.js';
import uploader from '../middlewares/uploader.js';
import validate from '../middlewares/validate.js';
import { file } from '../schemas/index.js';

const router = Router();

router
  .get( // Read root files/folders
    '/:id/file',
    auth('instance:file:read'),
    Middleware.verifyPath,
    Controller.read,
  )
  .get( // Read content or Download files/folders
    '/:id/file/*path',
    auth('instance:file:read'),
    Middleware.verifyPath,
    Controller.read,
  )
  .post( // Unzip files
    '/:id/file/*path/actions/unzip',
    auth('instance:file:unzip'),
    Middleware.verifyPath,
    Controller.unzip,
  )
  .post( // Create or Upload files/folders
    '/:id/file/*path',
    auth('instance:file:create'),
    InstanceMiddleware.verifyRunning,
    Middleware.verifyNewPath,
    uploader.single('file'),
    validate(file),
    Controller.create,
  )
  .put( // Update files content
    '/:id/file/*path',
    auth('instance:file:update'),
    InstanceMiddleware.verifyRunning,
    Middleware.verifyPath,
    validate(file),
    Controller.update,
  )
  .delete( // Delete files/folders
    '/:id/file/*path',
    auth('instance:file:delete'),
    InstanceMiddleware.verifyRunning,
    Middleware.verifyPath,
    Controller.delete,
  )
  .patch( // Move files/folders
    '/:id/file/*path/to/*destiny',
    auth('instance:file:move'),
    InstanceMiddleware.verifyRunning,
    Middleware.verifyPath,
    Middleware.verifyDestiny,
    Controller.move,
  );

export default router;
