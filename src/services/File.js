import fs from 'fs';
import Path from 'path';
import AdmZip from 'adm-zip';
import { randomUUID } from 'crypto';
import archiver from 'archiver';
import config from '../../config/config.js';
import { Base, InvalidRequest } from '../errors/index.js';

class File {
  static createTempPath() {
    const timestamp = new Date().getTime();
    const tempPath = Path.join(config.temp.path, timestamp);

    fs.mkdirSync(tempPath);
    return tempPath;
  }

  static verifyType(path) {
    const stats = fs.statSync(path);
    const isDir = stats.isDirectory(path);
    const isFile = stats.isFile(path);

    if (isDir) return 'dir';
    if (isFile) return 'file';
    throw new Base('Invalid file type!');
  }

  static read(id, path = '', info = '') {
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const type = info || File.verifyType(absolutePath);
    let content;

    if (type === 'file') content = fs.readFileSync(absolutePath, 'utf8');
    else {
      const items = fs.readdirSync(absolutePath);
      content = [];
      items.forEach((item) => {
        content.push({
          name: item,
          type: File.verifyType(`${absolutePath}/${item}`),
        });
      });
    }

    return {
      type,
      content,
    };
  }

  static create(id, path, data) {
    const { type } = data;
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    let content = '';

    if (type === 'dir') {
      fs.mkdirSync(absolutePath);
      content = [];
    } else {
      fs.writeFileSync(absolutePath, data.content, 'utf8');
      content = data.content;
    }

    return {
      type,
      content,
    };
  }

  static update(id, path, data) {
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const type = File.verifyType(absolutePath);
    if (type === 'file') fs.writeFileSync(absolutePath, data.content, 'utf8');

    return File.read(id, path, type);
  }

  static delete(id, path) {
    const info = File.read(id, path);
    fs.rmSync(`${config.instance.path}/${id}/${path}`, { recursive: true });

    return info;
  }

  static addFolderToZip(zip, folderPath, folderInZipPath) {
    const items = fs.readdirSync(folderPath);
    items.forEach((item) => {
      const fullPath = Path.join(folderPath, item);
      const pathInZip = Path.join(folderInZipPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        File.addFolderToZip(zip, fullPath, pathInZip);
      } else {
        zip.addLocalFile(fullPath, folderInZipPath);
      }
    });
  }

  static zip(pathFrom, pathTo) {
    const zip = new AdmZip();
    File.addFolderToZip(zip, pathFrom, '');
    zip.writeZip(pathTo);
  }

  static download(id, path) {
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const type = File.verifyType(absolutePath);

    // File
    if (type === 'file') return absolutePath;

    // Path
    const tempPath = File.createTempPath();
    const pathTo = `${tempPath}/${randomUUID()}.zip`;
    File.zip(absolutePath, pathTo);
    return pathTo;
  }

  static verifyZipFile(filePath) {
    const ZIP_SIGNATURE = [0x50, 0x4B]; // PK
    const buffer = Buffer.alloc(2);

    try {
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 2, 0);
      fs.closeSync(fd);
      return buffer[0] === ZIP_SIGNATURE[0] && buffer[1] === ZIP_SIGNATURE[1];
    } catch (err) {
      throw new Base('Error verifying zip file!');
    }
  }

  static unzip(id, path) {
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const type = File.verifyType(absolutePath);

    // Validate
    if (type !== 'file') throw new InvalidRequest("You can't unzip a folder!");
    if (!File.verifyZipFile(absolutePath)) throw new InvalidRequest('Invalid zip file!');

    // Unzip
    const parentDir = Path.dirname(absolutePath);
    const extractPathName = randomUUID();
    const extractTo = `${parentDir}/${extractPathName}`;
    fs.mkdirSync(extractTo);

    const zip = new AdmZip(absolutePath);
    zip.extractAllTo(extractTo, true);

    return extractPathName;
  }

  static move(id, path, destiny) {
    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const absoluteDestiny = `${config.instance.path}/${id}/${destiny}`;

    fs.renameSync(absolutePath, absoluteDestiny);

    return true;
  }

  static makeBackup(id) {
    return new Promise((resolve, reject) => {
      const instancePath = Path.join(config.instance.path, id);
      if (!fs.existsSync(instancePath)) reject();

      const backupsPath = Path.join(instancePath, 'backups');
      if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath, { recursive: true });

      const backupName = `backup-${Date.now()}.zip`;
      const outputPath = Path.join(backupsPath, backupName);
      const output = fs.createWriteStream(outputPath);

      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', () => resolve(outputPath));
      archive.on('error', reject);

      archive.pipe(output);

      const dirsToBackup = ['world', 'world_nether', 'world_the_end', 'plugins'];
      dirsToBackup.forEach((dir) => {
        const full = Path.join(instancePath, dir);
        if (fs.existsSync(full)) archive.directory(full, dir);
      });

      const filesToBackup = ['server.properties'];
      filesToBackup.forEach((file) => {
        const full = Path.join(instancePath, file);
        if (fs.existsSync(full)) archive.file(full, { name: file });
      });

      archive.finalize();
    });
  }

  static deleteOldBackups(id, newBackupPath) {
    const instancePath = Path.join(config.instance.path, id);
    const backupsPath = Path.join(instancePath, 'backups');
    if (!fs.existsSync(instancePath) || !fs.existsSync(backupsPath)) return;

    const newBackupFilename = Path.basename(newBackupPath);
    const files = fs.readdirSync(backupsPath);
    files.forEach((file) => {
      if (file !== newBackupFilename) {
        fs.rmSync(Path.join(backupsPath, file), { recursive: true, force: true });
      }
    });
  }
}

export default File;
