import Path from 'path';
import { NotFound, InvalidRequest, Unathorized } from '../errors/index.js';
import config from '../../config/config.js';
import handleError from './handleError.js';
import Service from '../services/File.js';

const verifyDirectoryTraversal = (path) => {
  const regex = /\.\./;
  if (regex.test(path)) throw new InvalidRequest('directory traversal is not allowed!');
};

const verifyAllowedPath = (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  if (!fullPath.startsWith(instancePath)) throw new Unathorized(`${path} is forbidden!`);
};

const verifyPathExists = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  if (!(await Service.verifyExists(fullPath))) throw new NotFound(`${path} path not exists!`);
};

const verifyPathNotExists = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  if (await Service.verifyExists(fullPath)) throw new InvalidRequest(`${path} path already exists!`);
};

const verifyPathIsDirectory = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  const pathType = await Service.getType(fullPath);
  if (pathType !== 'directory') throw new InvalidRequest(`${path} path must be a directory!`);
};

const verifyPath = (verifyDestiny = false) => async (req, res, next) => {
  try {
    const instancePath = Path.join(config.instance.path, req.params.id);
    const path = req?.query?.path || '';
    const destiny = req?.query?.destiny || '';

    // Verify directory traversal
    verifyDirectoryTraversal(path);
    verifyDirectoryTraversal(destiny);

    // Validate if path is allowed
    verifyAllowedPath(instancePath, path);
    verifyAllowedPath(instancePath, destiny);

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
