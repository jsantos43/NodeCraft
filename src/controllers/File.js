import Service from '../services/File.js';

class File {
  static read(req, res, next) {
    try {
      const { id } = req.params;
      const { query } = req;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      // Download file
      if (query.download === 'true') {
        const result = Service.download(id, path);
        return res.download(result);
      }

      // Read file content
      const result = Service.read(id, path);
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return next(err);
    }
  }

  static create(req, res, next) {
    try {
      const { id } = req.params;
      const body = req?.body;
      const location = req?.location;
      const filename = req?.filename;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      if (location || filename) {
        return res.status(201).json({
          success: true, uploaded: true, location, filename,
        });
      }

      const result = Service.create(id, path, body);

      return res.status(201).json({ success: true, created: true, ...result });
    } catch (err) {
      return next(err);
    }
  }

  static update(req, res, next) {
    try {
      const { id } = req.params;
      const { body } = req;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      const result = Service.update(id, path, body);

      return res.status(200).json({ success: true, updated: true, ...result });
    } catch (err) {
      return next(err);
    }
  }

  static delete(req, res, next) {
    try {
      const { id } = req.params;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      const result = Service.delete(id, path);
      return res.status(200).json({ success: true, deleted: true, ...result });
    } catch (err) {
      return next(err);
    }
  }

  static async unzip(req, res, next) {
    try {
      const { id } = req.params;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      const pathName = Service.unzip(id, path);
      return res.status(200).json({ success: true, unzipped: true, name: pathName });
    } catch (err) {
      return next(err);
    }
  }

  static async move(req, res, next) {
    try {
      const { id } = req.params;
      let path = req?.params?.path;
      if (Array.isArray(path)) path = req.params.path.join('/');

      let destiny = req?.params?.destiny;
      if (Array.isArray(destiny)) destiny = req.params.destiny.join('/');

      const result = Service.move(id, path, destiny);

      return res.status(200).json({
        success: true, moved: result, path, destiny,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export default File;
