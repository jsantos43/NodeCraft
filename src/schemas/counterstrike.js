import Joi from 'joi';

const counterstrike = Joi.object({
  steamToken: Joi.string().trim().max(100),
  servername: Joi.string().trim().min(3).max(32),
  password: Joi.string().trim().min(3).max(32),
  rconPassword: Joi.string().trim().min(3).max(32),
  mode: Joi.string().trim().lowercase().valid('casual', 'competitive', 'wingman', 'deathmatch'),
  map: Joi.string().trim().lowercase().valid(
    'mirage',
    'dust2',
    'inferno',
    'nuke',
    'overpass',
    'vertigo',
    'ancient',
    'anubis',
    'officie',
    'italy',
    'lake',
    'thistle',
    'assembly',
    'memento',
  ),
  botDifficulty: Joi.number().integer().min(0).max(3),
  botQuota: Joi.number().integer().min(0).max(20),
  botMode: Joi.string().trim().lowercase().valid('fill', 'normal'),
});

export default counterstrike;
