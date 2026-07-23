import { InvalidRequest, NotFound } from '../errors/index.js';
import { Link as Model, User as UserModel } from '../models/index.js';
import User from './User.js';

class Link {
  static async readAll() {
    const links = await Model.findAll();

    return links;
  }

  static async readAllByInstance(instanceId) {
    const links = await Model.findAll({
      where: {
        instanceId,
      },
      include: [{
        model: UserModel,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      }],
    });

    return links;
  }

  static async readOne(instanceId, linkId) {
    const link = await Model.findOne({
      where: {
        id: linkId,
        instanceId,
      },
    });
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

    if (!link) throw new NotFound('Link not found!');

    return link;
  }

  static async verifyUserIsAlreadyLinked(userId, instanceId) {
    const user = await User.readOne(userId);

    if (!user.instances) return false;

    return user.instances.some((link) => link.instanceId === instanceId);
  }

  static async create(instanceId, data) {
    // Verify if user is already linked with instance
    if (await Link.verifyUserIsAlreadyLinked(data.userId, instanceId)) {
      throw new InvalidRequest('User is already linked with this instance');
    }

    const link = await Model.create({
      instanceId,
      userId: data.userId,
      permissions: data.permissions,
    });

    return link;
  }

  static async update(instanceId, linkId, data) {
    const link = await Link.readOne(instanceId, linkId);
    await link.update(data);

    return link;
  }

  static async delete(instanceId, linkId) {
    const link = await Link.readOne(instanceId, linkId);
    await link.destroy();

    return link;
  }

  static async deleteByUserAndInstance(userId, instanceId) {
    const link = await Link.readByUserAndInstance(userId, instanceId);
    if (link) await link.destroy();

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
    const link = await Link.readByUserAndInstance(userId, instanceId);

    return link?.permissions || [];
  }
}

export default Link;
