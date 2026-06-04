import Path from 'path';
import config from '../../config/config.js';
import Service from '../services/File.js';
import { InvalidRequest } from '../errors/index.js';

class File {
  static async read(req, res, next) {
    try {
      const query = req?.query;

      const path = query?.path || '';
      const toDownload = query?.download === 'true';

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullPath = Path.join(instancePath, path);

      const pathType = await Service.getType(fullPath);

      let content = null;
      if (pathType === 'file') {
        if (toDownload) return res.download(fullPath);

        content = await Service.readOneFile(fullPath);
      } else if (pathType === 'directory') {
        if (toDownload) {
          const tempPath = await Service.createTemp();
          const downloadName = `download-${Date.now()}.zip`;
          const downloadPath = Path.join(tempPath, downloadName);
          await Service.makeZip(downloadPath, [fullPath]);

          return res.download(downloadPath);
        }

        content = await Service.readOneDirectory(fullPath, true);
      } else {
        throw new InvalidRequest('This path is not directory or file');
      }

      return res.status(200).json({
        success: true,
        path,
        type: pathType,
        content,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async create(req, res, next) {
    try {
      console.log('ok');
      const { destiny } = req.query;
      const body = req?.body;

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullDestiny = Path.join(instancePath, destiny);

      if (body.type === 'file') await Service.createOneFile(fullDestiny, body.content);
      if (body.type === 'directory') await Service.createOneDirectory(fullDestiny);

      return res.status(201).json({
        success: true,
        destiny,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async upload(req, res, next) {
    try {
      const { destiny } = req.query;

      return res.status(201).json({
        success: true,
        destiny,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { path } = req.query;
      const { content } = req.body;

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullPath = Path.join(instancePath, path);

      const pathType = await Service.getType(fullPath);

      if (pathType !== 'file') throw new InvalidRequest('This path must be a file');

      await Service.createOneFile(fullPath, content);

      return res.status(200).json({
        success: true,
        path,
        content,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { path } = req.query;

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullPath = Path.join(instancePath, path);

      await Service.delete(fullPath);

      return res.status(200).json({
        success: true,
        path,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async transfer(req, res, next) {
    try {
      const { path, destiny } = req.query;
      const actions = req.query?.actions || '';

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullPath = Path.join(instancePath, path);
      const fullDestiny = Path.join(instancePath, destiny);

      if (actions === 'move') await Service.move(fullPath, fullDestiny);
      else if (actions === 'copy') await Service.copy(fullPath, fullDestiny);
      else throw new InvalidRequest('Transfer action is invalid!');

      return res.status(200).json({
        success: true,
        path,
        destiny,
      });
    } catch (err) {
      return next(err);
    }
  }

  static async unzip(req, res, next) {
    try {
      const { path, destiny } = req.query;

      const instancePath = Path.join(config.paths.instances, req.params.id);
      const fullPath = Path.join(instancePath, path);
      const fullDestiny = Path.join(instancePath, destiny);

      // Verify if path is a zip
      if (!(await Service.verifyZip(fullPath))) {
        throw new InvalidRequest(`${path} path is not a zip file`);
      }

      await Service.unzip(fullPath, fullDestiny);

      return res.status(200).json({
        success: true,
        uncompressing: true,
        path,
        destiny,
        name: Path.basename(fullDestiny),
      });
    } catch (err) {
      return next(err);
    }
  }
}

export default File;
