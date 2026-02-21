import multer from 'multer';
import config from '../../config/config.js';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const { id } = req.params;
    let path = req?.params?.path;
    if (Array.isArray(path)) path = req.params.path.join('/');

    const absolutePath = `${config.instance.path}/${id}/${path}`;
    const pathSplited = path.split('/');

    const filename = pathSplited[pathSplited.length - 1];
    const destiny = absolutePath.replace(filename, '');
    const location = path.replace(filename, '');

    req.filename = filename;
    req.destiny = destiny;
    req.location = location;
    cb(null, destiny);
  },
  filename(req, file, cb) {
    cb(null, req.filename);
  },
});

const uploader = multer({
  storage,
});

export default uploader;
