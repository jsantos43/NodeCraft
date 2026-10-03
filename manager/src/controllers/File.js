import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { proxyToWorker, readWorkerJson, sendWorkerJson } from '../utils/proxyFetch.js';

class File {
  static async read(req, res, next) {
    try {
      const { id } = req.params;
      const { path, download } = req.query;
      const toDownload = download === 'true';

      const response = await proxyToWorker(id, {
        streaming: toDownload,
        route: `/files?path=${encodeURIComponent(path || '')}&download=${toDownload}`,
      });

      if (!response.ok) {
        const result = await readWorkerJson(response);
        return res.status(response.status).json(result);
      }

      if (toDownload) {
        // Set a content-type from worker response or define a generic type
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

        // Set Content-Disposition
        const disposition = response.headers.get('content-disposition');
        if (disposition) res.setHeader('Content-Disposition', disposition);

        try {
          await pipeline(Readable.fromWeb(response.body), res);
        } catch (err) {
          if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') return undefined;

          throw err;
        }

        return undefined;
      }

      const result = await readWorkerJson(response);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { id } = req.params;
      const { destiny } = req.query;

      const response = await proxyToWorker(id, {
        route: `/files/create?destiny=${encodeURIComponent(destiny || '')}`,
        method: 'POST',
        body: req.body || {},
      });

      return await sendWorkerJson(res, response, 201);
    } catch (err) {
      return next(err);
    }
  }

  static async upload(req, res, next) {
    try {
      const { id } = req.params;
      const { destiny } = req.query;

      const response = await proxyToWorker(id, {
        streaming: true,
        route: `/files/upload?destiny=${encodeURIComponent(destiny || '')}`,
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'],
        },
        body: req,
      });

      return await sendWorkerJson(res, response, 201);
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { path } = req.query;

      const response = await proxyToWorker(id, {
        method: 'PUT',
        route: `/files/edit?path=${encodeURIComponent(path || '')}`,
        body: req.body || {},
      });

      return await sendWorkerJson(res, response, 200);
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { path } = req.query;

      const response = await proxyToWorker(id, {
        method: 'DELETE',
        route: `/files/delete?path=${encodeURIComponent(path || '')}`,
      });

      return await sendWorkerJson(res, response, 200);
    } catch (err) {
      return next(err);
    }
  }

  static async transfer(req, res, next) {
    try {
      const { id } = req.params;
      const { path, destiny, actions } = req.query;

      const response = await proxyToWorker(id, {
        route: `/files/transfer?path=${encodeURIComponent(path || '')}&destiny=${encodeURIComponent(destiny || '')}&actions=${encodeURIComponent(actions || '')}`,
        method: 'POST',
      });

      return await sendWorkerJson(res, response, 200);
    } catch (err) {
      return next(err);
    }
  }

  static async unzip(req, res, next) {
    try {
      const { id } = req.params;
      const { path, destiny } = req.query;

      const response = await proxyToWorker(id, {
        route: `/files/unzip?path=${encodeURIComponent(path || '')}&destiny=${encodeURIComponent(destiny || '')}`,
        method: 'POST',
      });

      return await sendWorkerJson(res, response, 200);
    } catch (err) {
      return next(err);
    }
  }
}

export default File;
