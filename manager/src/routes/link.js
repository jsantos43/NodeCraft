import { Router } from 'express';
import { auth, validate } from '../middlewares/index.js';
import { createLink, updateLink } from '../schemas/index.js';
import Controller from '../controllers/Link.js';

const router = Router();

router
  .get(
    '/:id/link',
    auth('instance:read'),
    Controller.readAll,
  )
  .get(
    '/:id/link/:linkId',
    auth('instance:read'),
    Controller.readOne,
  )
  .post(
    '/:id/link',
    auth('instance:owner'),
    validate(createLink),
    Controller.create,
  )
  .put(
    '/:id/link/:linkId',
    auth('instance:owner'),
    validate(updateLink),
    Controller.update,
  )
  .delete(
    '/:id/link/:linkId',
    auth('instance:owner'),
    Controller.delete,
  );

export default router;
