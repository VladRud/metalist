'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadFile = uploadFile;
exports.getTeamLogos = getTeamLogos;

var _file = require('./file.service');

var fileService = _interopRequireWildcard(_file);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('File');

function uploadFile(req, res) {
  return fileService.uploadFile(req, res).then(respondWithResult(res)).catch(handleError(res));
}

function getTeamLogos(req, res) {
  return fileService.getTeamLogos().then(respondWithResult(res)).catch(handleError(res));
}

//private functions

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      logger.info('respondWithResult ' + entity);
      return res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('handleError ' + err);
    res.status(statusCode).send(err);
  };
}