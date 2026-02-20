import Joi from 'joi';

const minecraft = Joi.object({
  software: Joi.string().trim().lowercase().valid('vanilla', 'paper', 'purpur'),
  bedrock: Joi.boolean(),
  gamemode: Joi.string().trim().lowercase().valid('survival', 'creative', 'adventure'),
  difficulty: Joi.string().trim().lowercase().valid('peaceful', 'easy', 'normal', 'hard'),
  seed: Joi.string().trim().min(0).max(50),
  motd: Joi.string().trim().min(0).max(50),
  levelType: Joi.string().trim().lowercase().valid('minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified'),
  viewDistance: Joi.number().integer().min(3).max(32),
  spawn: Joi.number().integer().min(0).max(32),
  idle: Joi.number().integer().min(0).max(1440),
  commandBlock: Joi.boolean(),
  pvp: Joi.boolean(),
  licensed: Joi.boolean(),
  allowlist: Joi.boolean(),
  nether: Joi.boolean(),
  secureProfile: Joi.boolean(),
  forceGamemode: Joi.boolean(),
  hardcore: Joi.boolean(),
  animals: Joi.boolean(),
  monsters: Joi.boolean(),
  npcs: Joi.boolean(),
  cheats: Joi.boolean(),
});

export default minecraft;
