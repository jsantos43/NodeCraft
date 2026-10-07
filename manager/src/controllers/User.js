import Service from '../services/User.js';

class User {
  static async create(req, res, next) {
    try {
      const { body } = req;

      const userId = await Service.create(body);
      const user = await Service.readOne(userId);

      return res.status(201).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async read(req, res, next) {
    try {
      const { user } = req;

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async readAll(req, res, next) {
    try {
      const users = await Service.readAll();

      return res.status(200).json({ success: true, users });
    } catch (err) {
      return next(err);
    }
  }

  static async readById(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user.admin
        ? await Service.readAdminProfile(id)
        : await Service.readProfile(id);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { body } = req;
      const { user } = req;

      const userUpdated = await Service.update(user.id, body);

      return res.status(200).json({ success: true, user: userUpdated });
    } catch (err) {
      return next(err);
    }
  }

  static async updateOther(req, res, next) {
    try {
      const { body } = req;
      const { id } = req.params;

      const user = await Service.update(id, body);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { user } = req;
      await Service.delete(user.id);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }

  static async deleteOther(req, res, next) {
    try {
      const { id } = req.params;
      const user = await Service.delete(id);

      return res.status(200).json({ success: true, user });
    } catch (err) {
      return next(err);
    }
  }
}

export default User;
