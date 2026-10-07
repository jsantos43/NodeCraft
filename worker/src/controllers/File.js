import Path from 'path';
import { realpath } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { openInsideInstance } from '../utils/verifyPaths.js';
import config from '../../config/config.js';
import Service from '../services/File.js';
import { InvalidRequest } from '../errors/index.js';

class File {
  static async read(req, res, next) {
    let handle;

    try {
      const path = req.query?.path || '';
      const toDownload = req.query?.download === 'true';

      const instancePath = await realpath(Path.join(config.paths.instances, req.params.id));
      const fullPath = Path.join(instancePath, path);

      const opened = await openInsideInstance(instancePath, fullPath);
      handle = opened.handle;
      const pathType = opened.stats.isFile() ? 'file' : 'directory';

      let content;
      if (pathType === 'file') {
        if (toDownload) {
          res.attachment(Path.basename(fullPath));
          await pipeline(handle.createReadStream({ autoClose: false }), res);
          return undefined;
        }

        content = await handle.readFile('utf8');
      } else if (toDownload) {
        const tempPath = await Service.createTemp();
        const downloadName = `download-${Date.now()}.zip`;
        const downloadPath = Path.join(tempPath, downloadName);

        await Service.makeZip(downloadPath, [fullPath], instancePath);

        return res.download(downloadPath);
      } else {
        content = await Service.readOneDirectory(fullPath, true, instancePath);
      }

      return res.status(200).json({
        success: true, path, type: pathType, content,
      });
    } catch (err) {
      if (res.headersSent) {
        res.destroy(err);
        return undefined;
      }

      return next(err);
    } finally {
      if (handle) await handle.close();
    }
  }

  static async create(req, res, next) {
    try {
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

      // The ZIP signature and contents are read through the same verified handle.
      await Service.unzip(fullPath, fullDestiny, instancePath);

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
