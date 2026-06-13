import { Readable } from 'stream';
import getWorkerContext from '../utils/getWorkerContext.js';
import proxyFetch from '../utils/proxyFetch.js';

class File {
  static async read(req, res, next) {
    try {
      const { id } = req.params;
      const { path, download } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files?path=${path || ''}&download=${download || false}`;
      const response = await proxyFetch(route, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      if (download) {
        // Set a content-type from worker response or define a generic type
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

        // Set Content-Disposition
        const disposition = response.headers.get('content-disposition');
        if (disposition) res.setHeader('Content-Disposition', disposition);

        // Follow worker response body to user
        return Readable.fromWeb(response.body).pipe(res);
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { id } = req.params;
      const { destiny } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files/create?destiny=${destiny || ''}`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify(req.body || {}),
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async upload(req, res, next) {
    try {
      const { id } = req.params;
      const { destiny } = req.query;

      const { worker } = await getWorkerContext(id);

      // Send form data body to worker
      const form = new FormData();
      form.append(
        'file',
        new Blob([req.file.buffer], { type: req.file.mimetype }),
        req.file.originalname,
      );

      const route = `${worker.url}/server/${id}/files/upload?destiny=${destiny || ''}`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: { Authorization: `Bearer ${worker.secret}` },
        body: form,
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { path } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files/edit?path=${path || ''}`;
      const response = await proxyFetch(route, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
        body: JSON.stringify(req.body || {}),
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { path } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files/delete?path=${path || ''}`;
      const response = await proxyFetch(route, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async transfer(req, res, next) {
    try {
      const { id } = req.params;
      const { path, destiny, actions } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files/transfer?path=${path || ''}&destiny=${destiny || ''}&actions=${actions || ''}`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  static async unzip(req, res, next) {
    try {
      const { id } = req.params;
      const { path, destiny } = req.query;

      const { worker } = await getWorkerContext(id);

      const route = `${worker.url}/server/${id}/files/unzip?path=${path || ''}&destiny=${destiny || ''}`;
      const response = await proxyFetch(route, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${worker.secret}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        return res.status(response.status).json(result);
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }
}

export default File;
