import Path from 'path';
import { lstat } from 'node:fs/promises';
import {
  NotFound, InvalidRequest, Forbidden,
} from '../errors/index.js';
import Service from '../services/File.js';

const verifyNoSymlinks = async (fullPath, allowNew = false) => {
  const { root } = Path.parse(fullPath);
  let currentPath = root;

  const parts = fullPath.slice(root.length).split(Path.sep).filter(Boolean);
  for (const part of parts) {
    currentPath = Path.join(currentPath, part);

    try {
      const stats = await lstat(currentPath);

      if (stats.isSymbolicLink()) throw new Forbidden('Symbolic links are not allowed!');
    } catch (err) {
      // A new file is allowed; a dangling symlink is still rejected by lstat.
      if (allowNew && err.code === 'ENOENT' && currentPath === fullPath) return;

      throw err;
    }
  }
};

const verifyDirectoryTraversal = (path) => {
  const regex = /\.\./;
  if (regex.test(path)) throw new InvalidRequest('directory traversal is not allowed!');
};

const verifyAllowedPath = async (instancePath, path, allowNew = false) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));
  const relativePath = Path.relative(instancePath, fullPath);

  if (relativePath === '..'
    || relativePath.startsWith(`..${Path.sep}`) || Path.isAbsolute(relativePath)) {
    throw new Forbidden(`${path} is forbidden!`);
  }

  await verifyNoSymlinks(fullPath, allowNew);
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

export {
  verifyAllowedPath,
  verifyDirectoryTraversal,
  verifyNoSymlinks,
  verifyPathExists,
  verifyPathIsDirectory,
  verifyPathNotExists,
};
