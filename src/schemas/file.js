import Joi from 'joi';

const createFile = Joi.object({
  type: Joi.string().trim().valid('file', 'directory').required(),
  content: Joi.string(),
});

const updateFile = Joi.object({
  type: Joi.forbidden(),
  content: Joi.string().required(),
});

export { createFile, updateFile };
