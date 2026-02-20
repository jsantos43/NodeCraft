import Joi from 'joi';

const file = Joi.object({
  type: Joi.string().trim().valid('file', 'dir'),
  content: Joi.string(),
});

export default file;
