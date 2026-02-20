const CounterStrike = {
  steamToken: {
    type: 'string',
    max: 100,
  },
  hostname: {
    type: 'string',
    min: 3,
    max: 32,
  },
  password: {
    type: 'string',
    min: 3,
    max: 32,
  },
  rconPassword: {
    type: 'string',
    min: 3,
    max: 32,
  },
  maxPlayers: {
    type: 'number',
    int: true,
    min: 2,
    max: 20,
  },
  mode: {
    type: 'string',
    values: ['casual', 'competitive', 'wingman', 'deathmatch'],
  },
  map: {
    type: 'string',
    values: [
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
    ],
  },
  botDifficulty: {
    type: 'number',
    int: true,
    min: 0,
    max: 3,
  },
  botQuota: {
    type: 'number',
    int: true,
    min: 0,
    max: 20,
  },
  botMode: {
    type: 'string',
    values: ['fill', 'normal'],
  },
};

export default CounterStrike;
