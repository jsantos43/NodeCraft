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
});

export { createUser, updateUser };
