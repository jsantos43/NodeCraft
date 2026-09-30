// Public instance fields are opt-in. Internal worker payloads keep the full model.
const summaryAttributes = [
  'id', 'workerId', 'ownerId', 'name', 'type', 'port', 'memory', 'cpu',
  'maxPlayers', 'diskUsage', 'status', 'lastActivityAt', 'lastBackupAt',
  'backupRequestedAt', 'lastBackupStatus', 'createdAt',
];

function pick(source, fields) {
  return Object.fromEntries(fields.filter((key) => source[key] !== undefined)
    .map((key) => [key, source[key]]));
}

function instanceSummary(instance) {
  const data = instance.toJSON ? instance.toJSON() : instance;
  const result = pick(data, summaryAttributes);
  if (data.worker !== undefined) {
    result.worker = data.worker ? pick(data.worker, ['id', 'name', 'url', 'healthy']) : null;
  }
  return result;
}

function instanceView(instance, permissions) {
  const data = instance.toJSON ? instance.toJSON() : instance;
  const result = instanceSummary(data);
  // Connection instructions are basic data; never expose the full game config here.
  if (data.type === 'minecraft' && data.minecraft) {
    result.connection = pick(data.minecraft, ['bedrock', 'software']);
  }

  if (permissions.includes('instance:console:read') && data.history !== undefined) {
    result.history = data.history;
  }

  const canReadGame = permissions.includes('instance:edit')
    || permissions.includes('instance:read');
  if (canReadGame && data[data.type] !== undefined) {
    result[data.type] = data[data.type];
  }

  if (permissions.includes('instance:owner') && data.links !== undefined) {
    result.links = data.links;
  }

  if (permissions.includes('instance:roster:edit') && data.roster !== undefined) {
    result.roster = data.roster;
  }

  return result;
}

export { summaryAttributes, instanceSummary, instanceView };
