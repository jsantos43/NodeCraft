import { hash } from 'bcrypt';
import { Op, literal } from 'sequelize';
import {
  db, User as Model, Link as LinkModel, Instance as InstanceModel,
} from '../models/index.js';
import {
  NotFound, Internal, Unathorized, InvalidRequest,
} from '../errors/index.js';

class User {
  static async create(data) {
    const hashedPassword = await hash(data.password, 12);

    const user = await Model.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    return user.id;
  }

  static async readAll() {
    const user = await Model.findAll();

    return user;
  }

  static async readOne(id, sessionVersion = undefined) {
    const user = await Model.findOne({
      where: {
        id,
        ...(sessionVersion !== undefined ? { sessionVersion } : {}),
      },
      include: {
        model: LinkModel,
        as: 'instances',
      },
    });

    if (!user) {
      if (sessionVersion !== undefined) throw new Unathorized('Session is no longer valid!');
      throw new NotFound('User not found!');
    }

    return user;
  }

  static async readProfile(id) {
    const user = await Model.findOne({
      where: { id },
      attributes: ['id', 'name'],
    });

    if (!user) throw new NotFound('User not found!');

    return user;
  }

  static async readAllAttributes(id = null, email = null, token = null, tokenType = 'email') {
    const tokenColumns = {
      email: 'emailTokenHash',
      password: 'resetPasswordTokenHash',
      refresh: 'refreshTokenHash',
    };

    const where = {};
    if (id) {
      where.id = id;
    } else if (email) {
      where.email = email;
    } else if (token && tokenColumns[tokenType]) {
      where[tokenColumns[tokenType]] = token;
    }

    if (Object.keys(where).length === 0) throw new Internal('A search criteria is required!');

    const user = await Model.scope(null).findOne({ where });

    return user;
  }

  static async update(id, data) {
    const user = await User.readOne(id);
    await user.update(data);

    return user;
  }

  // Consume/replace a token only while the same unexpired token is still stored.
  static async updateIfTokenValid(id, tokenHash, type, data, sessionVersion = undefined) {
    const columns = {
      refresh: ['refreshTokenHash', 'refreshTokenExpires'],
      password: ['resetPasswordTokenHash', 'resetPasswordTokenExpires'],
    };

    if (!columns[type] || typeof tokenHash !== 'string' || !tokenHash) {
      throw new Internal('Invalid conditional token update!');
    }

    const [hashColumn, expiresColumn] = columns[type];
    const [updated] = await Model.scope(null).update({
      ...data,
      // Reset consumption also revokes every previously issued access token.
      ...(type === 'password' ? { sessionVersion: literal('sessionVersion + 1') } : {}),
    }, {
      where: {
        id,
        ...(sessionVersion !== undefined ? { sessionVersion } : {}),
        [hashColumn]: tokenHash,
        [expiresColumn]: { [Op.gt]: new Date() },
      },
    });

    return updated === 1;
  }

  static async saveLoginSession(id, sessionVersion, data) {
    const [updated] = await Model.scope(null).update(data, { where: { id, sessionVersion } });
    return updated === 1;
  }

  static async revokeSessions(id) {
    const [updated] = await Model.scope(null).update({
      sessionVersion: literal('sessionVersion + 1'),
      refreshTokenHash: null,
      refreshTokenExpires: null,
    }, { where: { id } });
    if (updated !== 1) throw new NotFound('User not found!');
  }

  static async delete(id) {
    return db.transaction(async (transaction) => {
      const user = await Model.findOne({
        where: { id },
        include: { model: LinkModel, as: 'instances' },
        transaction,
      });

      if (!user) throw new NotFound('User not found!');

      const runningInstances = await InstanceModel.findAll({
        where: { ownerId: id, status: 'running' },
        attributes: ['id', 'name'],
        transaction,
      });

      if (runningInstances.length > 0) {
        throw new InvalidRequest(runningInstances.map(
          (instance) => `Stop owned instance "${instance.name}" (${instance.id}) before deleting this account.`,
        ));
      }

      await user.destroy({ transaction });

      return user;
    });
  }
}

export default User;
