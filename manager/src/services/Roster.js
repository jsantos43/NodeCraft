import { InvalidRequest, NotFound } from '../errors/index.js';
import { Roster as Model } from '../models/index.js';
import providers from '../utils/resolvers.js';

class Roster {
  static async readAllByInstance(instanceId) {
    const rosters = await Model.findAll({
      where: { instanceId },
    });

    return rosters;
  }

  static async readOne(instanceId, rosterId) {
    const roster = await Model.findOne({
      where: {
        id: rosterId,
        instanceId,
      },
    });

    if (!roster) throw new NotFound('Roster not found!');

    return roster;
  }

  static async create(id, data) {
    const { identifier, name } = await Roster.resolve(data.platform, data.name);

    const roster = await Model.create({
      instanceId: id,
      identifier,
      platform: data.platform,
      name,
      access: data.access,
      privileged: data.privileged,
    });

    return roster;
  }

  static async update(instanceId, rosterId, data) {
    const roster = await Roster.readOne(instanceId, rosterId);
    await roster.update(data);

    return roster;
  }

  static async delete(instanceId, rosterId) {
    const roster = await Roster.readOne(instanceId, rosterId);
    await roster.destroy();

    return roster;
  }

  static async resolve(platform, input) {
    const provider = providers[platform];
    if (!provider) throw new InvalidRequest(`Unsupported platform: ${platform}`);

    return provider(input);
  }
}

export default Roster;
