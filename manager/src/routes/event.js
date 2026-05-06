import { Router } from 'express';
import Controller from '../controllers/Instance.js';
import { auth } from '../middlewares/index.js';

const router = Router();

router
  .get(
    '/worker',
    auth('admin'),
    Controller.readAll,
  )
  .get(
    '/worker/:id',
    auth('admin'),
    Controller.readOne,
  )
  .post(
    '/worker',
    auth('admin'),
    Controller.create,
  )
  .put(
    '/worker/:id',
    auth('admin'),
    Controller.update,
  )
  .delete(
    '/worker/:id',
    auth('admin'),
    Controller.delete,
  );

export default router;
