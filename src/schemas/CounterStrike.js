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
  mode: {
    type: 'string',
    values: ['casual', 'competitive', 'wingman', 'deathmatch'],
  },
};

export default CounterStrike;
