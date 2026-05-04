import Joi from 'joi';

const hytale = Joi.object({
  servername: Joi.string().trim().min(3).max(32),
  motd: Joi.string().trim().min(0).max(50),
  password: Joi.string().trim().min(0).max(32),
  maxView: Joi.number().integer().min(3).max(100),
  worldname: Joi.string().trim().min(3).max(32),
  gamemode: Joi.string().trim().valid('adventure', 'creative'),
});

export default hytale;
