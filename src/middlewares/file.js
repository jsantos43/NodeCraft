import { existsSync, realpathSync } from 'fs';
import * as Path from 'path';
import { NotFound, InvalidRequest, Unathorized } from '../errors/index.js';
import config from '../../config/config.js';
import handleError from './handleError.js';

const verifyTwoPoints = (path) => {
  const regex = /\.\./;
  if (regex.test(path)) return true;

  return false;
};

const validateAllowedPath = (id, path) => {
  const instancePath = realpathSync(`${config.instance.path}/${id}`);

  if (path.includes('nodecraft.json')) return false;
  if (path.startsWith(instancePath)) return true;
  return false;
};

// const verifyUUID = (id) => {
//   const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
//   return uuidRegex.test(id);
// };

const verifyFile = (req, res, next, newPath = false) => {
  try {
    const { id } = req.params;
    let path = req?.params?.path;
    if (Array.isArray(path)) path = req.params.path.join('/');

    // if (!verifyUUID(id)) throw new InvalidRequest(`${id} is not a valid uuid!`);
    if (verifyTwoPoints(path)) throw new InvalidRequest('directory traversal is not valid!');

    let realPath;

    if (newPath) {
      if (existsSync(`${config.instance.path}/${id}/${path}`)) throw new InvalidRequest(`${path} already exists!`);

      realPath = realpathSync(`${config.instance.path}/${id}/${Path.dirname(path)}`);
    } else {
      realPath = realpathSync(`${config.instance.path}/${id}/${path}`);
    }

    if (!validateAllowedPath(id, realPath)) throw new Unathorized(`${path} is forbidden!`);

    return next();
  } catch (err) {
    if (err.code === 'ENOENT') return handleError(new NotFound('path not exists!'), req, res);
    return handleError(err, req, res);
  }
};

const verifyPath = (req, res, next) => verifyFile(req, res, next, false);

const verifyNewPath = (req, res, next) => verifyFile(req, res, next, true);

const verifyDestiny = (req, res, next) => {
  // Change the path params to destiny only for the verify method
  const reqCopy = { params: structuredClone(req.params) };
  reqCopy.params.path = req.params.destiny;
  [reqCopy.params[0]] = [req.params[1]];

  return verifyFile(reqCopy, res, next, true);
};

export {
  verifyPath,
  verifyNewPath,
  verifyDestiny,
};
