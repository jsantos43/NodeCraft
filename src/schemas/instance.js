import Joi from 'joi';
import minecraft from './minecraft.js';
import counterstrike from './counterstrike.js';
import kerbal from './kerbal.js';
import hytale from './hytale.js';
import terraria from './terraria.js';

const createInstance = Joi.object({
  id: Joi.forbidden(),
  owner: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32).required(),
  type: Joi.string().trim().valid('minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal').required(),
  port: Joi.forbidden(),
  memory: Joi.number().integer().min(512),
  cpu: Joi.number().integer().min(1),
  maxPlayers: Joi.number().integer().min(1).max(1000),
  stauts: Joi.forbidden(),
  history: Joi.forbidden(),
  game: Joi.when('type', {
    switch: [
      { is: 'minecraft', then: minecraft },
      { is: 'counterstrike', then: counterstrike },
      { is: 'kerbal', then: kerbal },
      { is: 'hytale', then: hytale },
      { is: 'terraria', then: terraria },
    ],
    otherwise: Joi.forbidden(),
  }).required(),
});

const updateInstance = Joi.object({
  id: Joi.forbidden(),
  owner: Joi.forbidden(),
  name: Joi.string().trim().min(3).max(32),
  type: Joi.string().trim().strip().valid('minecraft', 'hytale', 'counterstrike', 'terraria', 'kerbal'),
  port: Joi.forbidden(),
  memory: Joi.number().integer().min(512),
  cpu: Joi.number().integer().min(1),
  maxPlayers: Joi.number().integer().min(1).max(1000),
  stauts: Joi.forbidden(),
  history: Joi.forbidden(),
  game: Joi.when('type', {
    switch: [
      { is: 'minecraft', then: minecraft },
      { is: 'counterstrike', then: counterstrike },
      { is: 'kerbal', then: kerbal },
      { is: 'hytale', then: hytale },
      { is: 'terraria', then: terraria },
    ],
    otherwise: Joi.forbidden(),
  }).required(),
});

export { createInstance, updateInstance };
