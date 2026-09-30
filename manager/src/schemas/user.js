import Joi from 'joi';
import config from '../../config/config.js';

const createUser = Joi.object({
  id: Joi.forbidden(),
  sessionVersion: Joi.forbidden(),
  admin: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  email: Joi.string().trim().max(254).email().required(),
  password: Joi.string().trim().min(8).max(72).required(),
  verified: Joi.forbidden(),
});

const updateUser = Joi.object({
  id: Joi.forbidden(),
  sessionVersion: Joi.forbidden(),
  admin: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  email: Joi.forbidden(),
  password: Joi.forbidden(),
  verified: Joi.forbidden(),
  maxInstances: Joi.forbidden(),
  maxMemory: Joi.forbidden(),
  maxCpu: Joi.forbidden(),
  maxDisk: Joi.forbidden(),
  allowedGames: Joi.forbidden(),
  allowedWorkers: Joi.forbidden(),
}).min(1);

// Used by admins to manage other users, including quotas.
const adminUpdateUser = Joi.object({
  id: Joi.forbidden(),
  sessionVersion: Joi.forbidden(),
  admin: Joi.boolean(),
  name: Joi.string().trim().min(3).max(32),
  email: Joi.forbidden(),
  password: Joi.forbidden(),
  verified: Joi.forbidden(),
  maxInstances: Joi.number().integer().min(0),
  maxMemory: Joi.number().integer().min(0),
  maxCpu: Joi.number().integer().min(0),
  maxDisk: Joi.number().integer().min(0),
  allowedGames: Joi.array().items(
    Joi.string().valid(...config.instance.games),
  ),
  allowedWorkers: Joi.array().items(Joi.string().trim()),
}).min(1);

export { createUser, updateUser, adminUpdateUser };
