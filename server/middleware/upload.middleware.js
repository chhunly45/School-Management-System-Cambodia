const multer = require('multer');
const config = require('../config');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const valid = allowed.test(file.mimetype);
    if (!valid) {
      return cb(new Error('Unsupported file format'), false);
    }
    cb(null, true);
  }
});

module.exports = upload;
