'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadFile = uploadFile;
exports.getTeamLogos = getTeamLogos;

var _child_process = require('child_process');

var sys = _interopRequireWildcard(_child_process);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var multer = require('multer');

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, './client/assets/teamLogo/');
  },
  filename: function filename(req, file, cb) {
    cb(null, file.originalname);
  }
});

var upload = multer({ storage: storage }).single('teamLogo');

function uploadFile(req, res) {
  return new Promise(function (resolve, reject) {
    upload(req, res, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve('file uploaded');
      }
    });
  });
}

function getTeamLogos() {
  return new Promise(function (resolve, reject) {
    sys.exec('ls client/assets/teamLogo/', function (err, itog1) {
      if (err) {
        return reject(err);
      } else {
        var arrFiles = itog1.split('\n');
        arrFiles.pop();
        return resolve(arrFiles);
      }
    });
  });
}