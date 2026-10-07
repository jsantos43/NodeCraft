import Path from 'path';
import {
  lstat, realpath, readlink, open, readdir, stat,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import {
  NotFound, InvalidRequest, Forbidden,
} from '../errors/index.js';

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

// Compares paths only; use realpath first when checking a symlink's destination.
const verifyInsideInstance = (instancePath, targetPath) => {
  const relativePath = Path.relative(instancePath, targetPath);

  if (relativePath === '..'
    || relativePath.startsWith(`..${Path.sep}`) || Path.isAbsolute(relativePath)) {
    throw new Forbidden('The path is outside the instance!');
  }
};

// Linux: validate the object actually opened before reading any of its contents.
// instancePath must be the trusted, canonical instance root.
const openInsideInstance = async (instancePath, targetPath) => {
  const resolvedPath = await realpath(targetPath);
  verifyInsideInstance(instancePath, resolvedPath);

  const handle = await open(
    resolvedPath,
    // eslint-disable-next-line no-bitwise
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );

  try {
    const openedPath = await readlink(`/proc/self/fd/${handle.fd}`);
    verifyInsideInstance(instancePath, openedPath);

    const stats = await handle.stat();
    if (!stats.isFile() && !stats.isDirectory()) {
      throw new InvalidRequest('Only regular files and directories are allowed!');
    }

    return { handle, stats };
  } catch (err) {
    await handle.close();
    throw err;
  }
};

// The callback must finish consuming the handle before it returns.
const visitInstanceFiles = async (instancePath, path, onEntry) => {
  const root = await realpath(instancePath);
  const ancestors = new Set();

  const visit = async (target, name) => {
    const { handle, stats } = await openInsideInstance(root, target);
    const identity = `${stats.dev}:${stats.ino}`;
    let added = false;

    try {
      if (stats.isDirectory()) {
        if (ancestors.has(identity)) throw new InvalidRequest('Circular directory link!');
        ancestors.add(identity);

        added = true;
      }

      await onEntry({ handle, stats, name });

      if (stats.isDirectory()) {
        const directory = `/proc/self/fd/${handle.fd}`;

        const names = await readdir(directory);
        for (const child of names) {
          await visit(Path.join(directory, child), Path.join(name, child));
        }
      }
    } finally {
      if (added) ancestors.delete(identity);
      await handle.close();
    }
  };

  await visit(Path.join(root, path), '');
};

const verifyAllowedPath = async (
  instancePath,
  path,
  allowNew = false,
  allowInternalLinks = false,
) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  verifyInsideInstance(instancePath, fullPath);

  if (allowInternalLinks) {
    // The instance root itself must not be replaceable by a tenant-owned link.
    await verifyNoSymlinks(instancePath);

    verifyInsideInstance(await realpath(instancePath), await realpath(fullPath));

    return;
  }

  await verifyNoSymlinks(fullPath, allowNew);
};

const verifyPathExists = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  try {
    await stat(fullPath);
  } catch (err) {
    if (err.code === 'ENOENT') throw new NotFound(`${path} path not exists!`);
    throw err;
  }
};

const verifyPathNotExists = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  try {
    await lstat(fullPath);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  throw new InvalidRequest(`${path} path already exists!`);
};

const verifyPathIsDirectory = async (instancePath, path) => {
  const fullPath = Path.resolve(Path.join(instancePath, path));

  const stats = await stat(fullPath);
  if (!stats.isDirectory()) throw new InvalidRequest(`${path} path must be a directory!`);
};

export {
  verifyAllowedPath,
  verifyDirectoryTraversal,
  verifyInsideInstance,
  openInsideInstance,
  visitInstanceFiles,
  verifyNoSymlinks,
  verifyPathExists,
  verifyPathIsDirectory,
  verifyPathNotExists,
};
