import Joi from 'joi';
import config from '../../config/config.js';

const createRoster = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  identifier: Joi.forbidden(),
  platform: Joi.string().trim().valid(...config.roster.platforms).required(),
  name: Joi.string().trim().min(1).max(50).required(),
  access: Joi.string().trim().valid(...config.roster.access).required(),
  privileged: Joi.boolean(),
});

const updateRoster = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  identifier: Joi.forbidden(),
  platform: Joi.forbidden(),
  name: Joi.forbidden(),
  access: Joi.string().trim().valid(...config.roster.access).required(),
  privileged: Joi.boolean(),
});

export { createRoster, updateRoster };
