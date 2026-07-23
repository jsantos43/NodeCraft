import Service from '../services/Link.js';

class Link {
  static async create(req, res, next) {
    try {
      const id = req?.params?.id;
      const data = req?.body;

      const link = await Service.create(id, data);

      return res.status(201).json({ success: true, link });
    } catch (err) {
      return next(err);
    }
  }

  static async readAll(req, res, next) {
    try {
      const id = req?.params?.id;
      const links = await Service.readAllByInstance(id);

      return res.status(200).json({ success: true, links });
    } catch (err) {
      return next(err);
    }
  }

  static async readOne(req, res, next) {
    try {
      const id = req?.params?.id;
      const linkId = req?.params?.linkId;
      const link = await Service.readOne(id, linkId);

      return res.status(200).json({ success: true, link });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const id = req?.params?.id;
      const linkId = req?.params?.linkId;
      const data = req?.body;

      const link = await Service.update(id, linkId, data);

      return res.status(200).json({ success: true, link });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req?.params?.id;
      const linkId = req?.params?.linkId;
      const link = await Service.delete(id, linkId);

      return res.status(200).json({ success: true, link });
    } catch (err) {
      return next(err);
    }
  }
}

export default Link;
