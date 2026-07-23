import { Router } from 'express';
import Controller from '../controllers/Roster.js';
import { auth, validate } from '../middlewares/index.js';
import { createRoster, updateRoster } from '../schemas/index.js';

const router = Router();

router
  .get(
    '/:id/roster',
    auth('instance:read'),
    Controller.readAll,
  )
  .get(
    '/:id/roster/:rosterId',
    auth('instance:read'),
    Controller.readOne,
  )
  .post(
    '/:id/roster',
    auth('instance:roster:edit'),
    validate(createRoster),
    Controller.create,
  )
  .put(
    '/:id/roster/:rosterId',
    auth('instance:roster:edit'),
    validate(updateRoster),
    Controller.update,
  )
  .delete(
    '/:id/roster/:rosterId',
    auth('instance:roster:edit'),
    Controller.delete,
  );

export default router;
