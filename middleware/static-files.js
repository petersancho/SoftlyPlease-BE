const path = require('path');

module.exports = function staticTweak(req, res, next) {
  const ext = path.extname(req.path).toLowerCase();
  if (ext === '.gh' || ext === '.ghx') {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
};
