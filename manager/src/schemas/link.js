import Joi from 'joi';
import config from '../../config/config.js';

const createLink = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  userId: Joi.string().trim().uuid().required(),
  permissions: Joi.array().items(Joi.string().valid('instance:read', ...config.instance.permissions)),
});

const updateLink = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  userId: Joi.forbidden(),
  permissions: Joi.array().items(Joi.string().valid('instance:read', ...config.instance.permissions)),
}).min(1);

export { createLink, updateLink };
