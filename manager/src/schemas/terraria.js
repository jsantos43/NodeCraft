import Joi from 'joi';

const terraria = Joi.object({
  difficulty: Joi.number().integer().min(0).max(3),
  password: Joi.string().trim().max(32),
  motd: Joi.string().trim().max(50),
});

export default terraria;
