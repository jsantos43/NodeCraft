import Joi from 'joi';

const createUser = Joi.object({
  id: Joi.forbidden(),
  admin: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
  verified: Joi.forbidden(),
  birthDate: Joi.date(),
});

const updateUser = Joi.object({
  id: Joi.forbidden(),
  admin: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  email: Joi.forbidden(),
  password: Joi.forbidden(),
  verified: Joi.forbidden(),
  birthDate: Joi.date(),
  maxInstances: Joi.forbidden(),
  maxMemory: Joi.forbidden(),
  maxCpu: Joi.forbidden(),
  maxDisk: Joi.forbidden(),
  allowedGames: Joi.forbidden(),
});

// Used by admins (PUT /user/:id) to manage other users, including quotas.
const adminUpdateUser = Joi.object({
  id: Joi.forbidden(),
  admin: Joi.boolean(),
  name: Joi.string().trim().min(3).max(32),
  email: Joi.forbidden(),
  password: Joi.forbidden(),
  verified: Joi.forbidden(),
  birthDate: Joi.date(),
  maxInstances: Joi.number().integer().min(0),
  maxMemory: Joi.number().integer().min(0),
  maxCpu: Joi.number().integer().min(0),
  maxDisk: Joi.number().integer().min(0),
  allowedGames: Joi.array().items(
    Joi.string().valid('minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal'),
  ),
});

export { createUser, updateUser, adminUpdateUser };
