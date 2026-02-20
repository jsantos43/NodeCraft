import { Router } from 'express';
import Controller from '../controllers/File.js';
import {
  auth, uploader, verifyPath, validate, verifyRunning, verifyNewPath, verifyDestiny,
} from '../middlewares/index.js';
import { file } from '../schemas/index.js';

const router = Router();

router
  .get( // Read root files/folders
    '/:id/file',
    auth('instance:file:read'),
    verifyPath,
    Controller.read,
  )
  .get( // Read content or Download files/folders
    '/:id/file/*path',
    auth('instance:file:read'),
    verifyPath,
    Controller.read,
  )
  .post( // Unzip files
    '/:id/file/*path/actions/unzip',
    auth('instance:file:unzip'),
    verifyPath,
    Controller.unzip,
  )
  .post( // Create or Upload files/folders
    '/:id/file/*path',
    auth('instance:file:create'),
    verifyRunning,
    verifyNewPath,
    uploader.single('file'),
    validate(file),
    Controller.create,
  )
  .put( // Update files content
    '/:id/file/*path',
    auth('instance:file:update'),
    verifyRunning,
    verifyPath,
    validate(file),
    Controller.update,
  )
  .delete( // Delete files/folders
    '/:id/file/*path',
    auth('instance:file:delete'),
    verifyRunning,
    verifyPath,
    Controller.delete,
  )
  .patch( // Move files/folders
    '/:id/file/*path/to/*destiny',
    auth('instance:file:move'),
    verifyRunning,
    verifyPath,
    verifyDestiny,
    Controller.move,
  );

export default router;
