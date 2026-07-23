import { hashSync } from 'bcrypt';
import { User as Model, Link as LinkModel } from '../models/index.js';
import { NotFound } from '../errors/index.js';

class User {
  static async create(data) {
    const hashedPassword = hashSync(data.password, 12);

    const user = await Model.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      javaGamertag: data.javaGamertag,
      bedrockGamertag: data.bedrockGamertag,
      gender: data.gender,
      birthDate: data.birthDate,
    });

    return user.id;
  }

  static async readAll() {
    const user = await Model.findAll();

    return user;
  }

  static async readOne(id) {
    const user = await Model.findOne({
      where: {
        id,
      },
      include: {
        model: LinkModel,
        as: 'instances',
      },
    });

    if (!user) throw new NotFound('User not found!');

    return user;
  }

  // Public profile lookup (GET /user/:id): scalar fields only (default scope
  // already hides secrets). Omits the `instances` link list so a logged user
  // can't enumerate which instances another user is linked to.
  static async readProfile(id) {
    const user = await Model.findOne({ where: { id } });

    if (!user) throw new NotFound('User not found!');

    return user;
  }

  static async readAllAttributes(id = null, email = null, token = null, tokenType = 'email') {
    const where = {};
    if (id) {
      where.id = id;
    } else if (email) {
      where.email = email;
    } else if (token) {
      if (tokenType === 'email') {
        where.emailTokenHash = token;
      } else if (tokenType === 'password') {
        where.resetPasswordTokenHash = token;
      } else if (tokenType === 'refresh') {
        where.refreshTokenHash = token;
      }
    }

    const user = await Model.scope(null).findOne({ where });

    return user;
  }

  static async update(id, data) {
    const user = await User.readOne(id);
    await user.update(data);

    return user;
  }

  static async delete(id) {
    const user = await User.readOne(id);
    await user.destroy();

    return user;
  }
}

export default User;
