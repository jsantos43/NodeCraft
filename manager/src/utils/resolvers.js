import { NotFound, ServiceUnavailable } from '../errors/index.js';

const providers = {
  // Java: name → Mojang's UUID
  async java(input) {
    const url = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(input)}`;
    const res = await fetch(url);

    if (res.status === 404 || res.status === 204) throw new NotFound('Java player not found!');
    if (!res.ok) throw new ServiceUnavailable('Mojang API unavailable!');

    const { id, name } = await res.json();

    return { identifier: id, name };
  },

  // Bedrock: gamertag → XUID (GeyserMC Public API)
  async bedrock(input) {
    const url = `https://api.geysermc.org/v2/xbox/xuid/${encodeURIComponent(input)}`;
    const res = await fetch(url);

    if (res.status === 404) throw new NotFound('Bedrock player not found!');
    if (!res.ok) throw new ServiceUnavailable('GeyserMC API unavailable!');

    const { xuid } = await res.json();

    return { identifier: String(xuid), name: input };
  },

  // Steam: vanity → SteamID64 (needs STEAM_API_KEY)
  async steam(input) {
    const key = process.env.STEAM_API_KEY;
    if (!key) throw new ServiceUnavailable('Steam resolver not configured!');

    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(input)}`;
    const res = await fetch(url);

    if (!res.ok) throw new ServiceUnavailable('Steam API unavailable!');

    const { response } = await res.json();
    if (response.success !== 1) throw new NotFound('Steam player not found!');

    return { identifier: response.steamid, name: input };
  },
};

export default providers;
