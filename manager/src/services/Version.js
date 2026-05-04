class Version {
  static async getMinecraftVanilla() {
    const manifest = await (await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json')).json();
    const latestRelease = manifest.latest.release;
    const latestVersionInfo = manifest.versions.find((v) => v.id === latestRelease);

    const versionDetails = await (await fetch(latestVersionInfo.url)).json();
    const serverURL = versionDetails.downloads.server.url;
    return { version: latestRelease, build: 0, url: serverURL };
  }

  static async getMinecraftPaper() {
    const firstResponse = await (await fetch('https://api.papermc.io/v2/projects/paper')).json();
    const version = firstResponse.versions.pop();

    const secondResponse = await (await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds`)).json();
    const build = secondResponse.builds.pop()?.build;

    const url = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${build}/downloads/paper-${version}-${build}.jar`;

    return { version, build, url };
  }

  static async getMinecraftPurpur() {
    const firstResponse = await (await fetch('https://api.purpurmc.org/v2/purpur')).json();
    const version = firstResponse.versions.pop();

    const secondResponse = await (await fetch(`https://api.purpurmc.org/v2/purpur/${version}`)).json();
    const build = secondResponse.builds.latest;

    const url = `https://api.purpurmc.org/v2/purpur/${version}/${build}/download`;

    return { version, build, url };
  }

  static async getMinecraftGeyserPlugin() {
    const response = await (await fetch('https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest')).json();

    const version = response?.version;
    const build = response?.build;
    const url = 'https://download.geysermc.org/v2/projects/geyser/versions/latest/builds/latest/downloads/spigot';

    return { version, build, url };
  }

  static async getMinecraftFloodgatePlugin() {
    const response = await (await fetch('https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest')).json();

    const version = response?.version;
    const build = response?.build;
    const url = 'https://download.geysermc.org/v2/projects/floodgate/versions/latest/builds/latest/downloads/spigot';

    return { version, build, url };
  }

  static async getLatest(instance) {
    let instanceInfo;
    let geyserInfo;
    let floodgateInfo;

    // Get Minecraft java latest info
    if (instance.software === 'paper') {
      instanceInfo = await Version.getMinecraftPaper();
    } else if (instance.software === 'purpur') {
      instanceInfo = await Version.getMinecraftPurpur();
    } else {
      instanceInfo = await Version.getMinecraftVanilla();
    }

    // Get Geyser and Floodgate latest info
    if (instance.bedrock === true) {
      geyserInfo = await Version.getMinecraftGeyserPlugin();
      floodgateInfo = await Version.getMinecraftFloodgatePlugin();
    }

    const info = {
      needInstanceUpdate: false,
      instanceVersion: instanceInfo?.version || '',
      instanceBuild: instanceInfo?.build || 0,
      instanceUrl: instanceInfo?.url || null,
      needGeyserUpdate: false,
      geyserVersion: geyserInfo?.version || '',
      geyserBuild: geyserInfo?.build || 0,
      geyserUrl: geyserInfo?.url || null,
      needFloodgateUpdate: false,
      floodgateVersion: floodgateInfo?.version || '',
      floodgateBuild: floodgateInfo?.build || 0,
      floodgateUrl: floodgateInfo?.url || null,
      neededUpdates: 0,
    };

    // Verify if instance needs updates
    info.needInstanceUpdate = instance.version !== info.instanceVersion;
    if (!info.needInstanceUpdate && info.instanceBuild) {
      info.needInstanceUpdate = Number(instance.build) !== Number(info.instanceBuild);
    }
    if (!instance.installed) info.needInstanceUpdate = true;
    // Verify if geyser and floodgate needs updates
    if (instance.bedrock) {
      info.needGeyserUpdate = Number(instance.geyserBuild) !== Number(info.geyserBuild);
      info.needFloodgateUpdate = Number(instance.floodgateBuild) !== Number(info.floodgateBuild);
    }

    // Count neededUpdates
    if (info.needInstanceUpdate) info.neededUpdates += 1;
    if (info.needGeyserUpdate) info.neededUpdates += 1;
    if (info.needFloodgateUpdate) info.neededUpdates += 1;

    return info;
  }
}

export default Version;
