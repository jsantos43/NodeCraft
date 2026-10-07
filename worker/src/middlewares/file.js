import Path from 'path';
import {
  NotFound, InvalidRequest,
} from '../errors/index.js';
import config from '../../config/config.js';
import handleError from './handleError.js';
import {
  verifyDirectoryTraversal,
  verifyAllowedPath,
  verifyPathExists,
  verifyPathNotExists,
  verifyPathIsDirectory,
} from '../utils/verifyPaths.js';

const verifyPath = (verifyDestiny = false, protectRoot = false) => async (req, res, next) => {
  try {
    const instancePath = Path.resolve(config.paths.instances, req.params.id);
    const path = req.query.path === undefined ? '' : req.query.path;
    const destiny = req.query.destiny === undefined ? '' : req.query.destiny;

    if (typeof path !== 'string' || typeof destiny !== 'string') {
      throw new InvalidRequest('Path and destiny must be strings!');
    }

    if (protectRoot || (verifyDestiny && req.query.actions === 'move')) {
      if (!path.trim() || Path.resolve(Path.join(instancePath, path)) === instancePath) {
        throw new InvalidRequest('Deleting or moving the instance root is not allowed!');
      }
    }

    // Verify directory traversal
    verifyDirectoryTraversal(path);
    verifyDirectoryTraversal(destiny);

    // Validate if path is allowed
    await verifyAllowedPath(instancePath, path, false, req.method === 'GET');
    if (verifyDestiny) await verifyAllowedPath(instancePath, destiny, true);

    // Verify if path exits
    await verifyPathExists(instancePath, path);

    // Verify if destiny is valid
    if (verifyDestiny) {
      const destinyDirName = Path.dirname(destiny);

      await verifyPathNotExists(instancePath, destiny);
      await verifyPathExists(instancePath, destinyDirName);
      await verifyPathIsDirectory(instancePath, destinyDirName);
    }

    return next();
  } catch (err) {
    if (err.code === 'ENOENT') return handleError(new NotFound('path not exists!'), req, res);

    return handleError(err, req, res);
  }
};

export default verifyPath;
