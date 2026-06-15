import { InvalidRequest, NotFound } from '../errors/index.js';
import { Link as Model, User as UserModel } from '../models/index.js';
import User from './User.js';

class Link {
  static async readUserLinks() {
    const links = await Model.findAll();

    return links;
  }

  static async readAllFromInstance(instanceId) {
    const links = await Model.findAll({
      where: {
        instanceId,
      },
      include: [{ model: UserModel, as: 'user', attributes: ['id', 'name', 'email'] }],
    });

    return links;
  }

  static async readOne(linkId) {
    const link = await Model.findByPk(linkId);

    if (!link) throw new NotFound('Link not found!');

    return link;
  }

  static async readByUserAndInstance(userId, instanceId) {
    const link = await Model.findOne({
      where: {
        instanceId,
        userId,
      },
    });

    return link;
  }

  static async verifyUserIsLinked(userId, instanceId) {
    if (!userId) return false;

    const user = await User.readOne(userId);

    if (!user.instances) return false;

    return user.instances.some((link) => link.instanceId === instanceId);
  }

  static async create(instanceId, data) {
    // Verify if user is already linked with instance
    if (await Link.verifyUserIsLinked(data.userId, instanceId)) {
      throw new InvalidRequest('User is already linked with this instance');
    }

    const link = await Model.create({
      instanceId,
      userId: data.userId || null,
      gamertags: data.gamertags || [],
      permissions: data.permissions,
      privileges: data.privileges,
      access: data.access,
    });

    return link;
  }

  static async update(linkId, data) {
    const link = await Link.readOne(linkId);

    // Only check for duplicate if userId is changing to a different user
    if (data.userId && data.userId !== link.userId) {
      if (await Link.verifyUserIsLinked(data.userId, link.instanceId)) {
        throw new InvalidRequest('User is already linked with this instance');
      }
    }

    await link.update(data);

    return link;
  }

  static async delete(linkId) {
    const link = await Link.readOne(linkId);
    await link.destroy();

    return link;
  }

  static async readInstancesIdByUserLink(userId) {
    const instancesId = [];

    const links = await Model.findAll({
      where: {
        userId,
      },
    });

    links.forEach((link) => {
      instancesId.push(link.instanceId);
    });

    return instancesId;
  }

  static async readUserPermissions(userId, instanceId) {
    const link = await Model.findOne({
      where: {
        instanceId,
        userId,
      },
    });

    return link?.permissions || [];
  }
}

export default Link;
