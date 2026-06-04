import multer from 'multer';
import Path from 'path';
import config from '../../config/config.js';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      const destiny = req.query?.destiny;

      const istancePath = Path.join(config.paths.instances, req.params.id);
      const fullDestiny = Path.join(istancePath, destiny);

      req.filename = Path.basename(fullDestiny);
      req.saveUploadPath = Path.dirname(fullDestiny);

      cb(null, req.saveUploadPath);
    } catch (err) {
      cb(err);
    }
  },

  filename(req, file, cb) {
    try {
      cb(null, req.filename);
    } catch (err) {
      cb(err);
    }
  },
});

export default multer({ storage });
