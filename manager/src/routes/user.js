import { Router } from 'express';
import Controller from '../controllers/User.js';
import { auth, validate } from '../middlewares/index.js';
import { createUser, updateUser, adminUpdateUser } from '../schemas/index.js';

const router = Router();

router
  .get(
    '/user',
    auth('logged'),
    Controller.read,
  )
  .get(
    '/user/all',
    auth('admin'),
    Controller.readAll,
  )
  .get(
    '/user/:id',
    auth('logged'),
    Controller.readById,
  )
  .post(
    '/user',
    validate(createUser),
    Controller.create,
  )
  .put(
    '/user',
    auth('logged'),
    validate(updateUser),
    Controller.update,
  )
  .put(
    '/user/:id',
    auth('admin'),
    validate(adminUpdateUser),
    Controller.updateOther,
  )
  .delete(
    '/user',
    auth('logged'),
    Controller.delete,
  )
  .delete(
    '/user/:id',
    auth('admin'),
    Controller.deleteOther,
  );

export default router;
