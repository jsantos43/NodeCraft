import Joi from 'joi';

const kerbal = Joi.object({
  servername: Joi.string().trim().min(3).max(32),
  gamemode: Joi.string().trim().uppercase().valid('SANDBOX', 'SCIENCE', 'CARRER'),
  difficulty: Joi.string().trim().uppercase().valid('EASY', 'NORMAL', 'MODERATE', 'HARD', 'CUSTOM'),
  warp: Joi.string().trim().uppercase().valid('MCW_FORCE', 'MCW_VOTE', 'MCW_LOWEST', 'SUBSPACE_SIMPLE', 'SUBSPACE', 'NONE'),
  allowlist: Joi.boolean(),
  cheats: Joi.boolean(),
});

export default kerbal;
