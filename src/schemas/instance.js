import Joi from 'joi';

const createInstance = Joi.object({
  id: Joi.forbidden(),
  owner: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  type: Joi.string().trim().valid('minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal').required(),
  port: Joi.forbidden(),
  memory: Joi.number().integer().min(512),
  cpu: Joi.number().integer().min(1),
  maxPlayers: Joi.number().integer().min(1).max(1000),
  stauts: Joi.forbidden(),
  history: Joi.forbidden(),
});

const updateInstance = Joi.object({
  id: Joi.forbidden(),
  owner: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32),
  type: Joi.forbidden(),
  port: Joi.forbidden(),
  memory: Joi.number().integer().min(512),
  cpu: Joi.number().integer().min(1),
  maxPlayers: Joi.number().integer().min(1).max(1000),
  stauts: Joi.forbidden(),
  history: Joi.forbidden(),
});

export { createInstance, updateInstance };
