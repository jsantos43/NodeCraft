import Joi from 'joi';

const createLink = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  userId: Joi.string().trim().uuid().required(),
  permissions: Joi.array(),
});

const updateLink = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  userId: Joi.forbidden(),
  permissions: Joi.array(),
});

export { createLink, updateLink };
