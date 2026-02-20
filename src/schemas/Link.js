import Joi from 'joi';

const link = Joi.object({
  id: Joi.forbidden(),
  instanceId: Joi.forbidden(),
  userId: Joi.string().trim().uuid(),
  gamertags: Joi.array(),
  permissions: Joi.array(),
  privileges: Joi.boolean(),
  access: Joi.string().trim().valid('super', 'always', 'monitored'),
});

export default link;
