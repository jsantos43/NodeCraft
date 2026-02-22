import Minecraft from './Minecraft.js';
import CounterStrike from './CounterStrike.js';
import Kerbal from './Kerbal.js';
import Hytale from './Hytale.js';
import Terraria from './Terraria.js';

const running = {};

const gameRuntimes = {
  minecraft: Minecraft,
  counterstrike: CounterStrike,
  kerbal: Kerbal,
  hytale: Hytale,
  terraria: Terraria,
};

export {
  running,
  gameRuntimes,
};
