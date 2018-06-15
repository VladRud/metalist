'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNextMatches = getNextMatches;
exports.getPrevMatches = getPrevMatches;
exports.getMatchById = getMatchById;
exports.createMatch = createMatch;
exports.deleteMatch = deleteMatch;
exports.updateMatch = updateMatch;

var _match = require('./match.service');

var matchService = _interopRequireWildcard(_match);

var _seat = require('../seat/seat.service');

var seatService = _interopRequireWildcard(_seat);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('Match');

function getNextMatches(req, res) {
  return matchService.getNextMatches().then(responseWithResult(res)).catch(handleError(res));
}

function getPrevMatches(req, res) {
  return matchService.getPrevMatches().then(responseWithResult(res)).catch(handleError(res));
}

function getMatchById(req, res) {
  return matchService.findById(req.params.id).then(handleEntityNotFound(res)).then(responseWithResult(res)).catch(handleError(res));
}

function createMatch(req, res) {
  console.log('createMatch req.body', req.body);
  var newMatch = req.body,
      matchDate = newMatch.date;

  return matchService.createMatch(newMatch).then(function (match) {
    seatService.createSeatsForMatch(match).then(function () {
      match.date = matchDate;
      return match.save();
    });
    return match;
  }).then(responseWithResult(res)).catch(handleError(res));
}

function deleteMatch(req, res) {
  var matchId = req.params.id;

  return Promise.all([matchService.removeById(matchId), seatService.deleteByMatchId(matchId)]).then(function () {
    return res.status(204).end();
  }).catch(handleError(res));
}

function updateMatch(req, res) {
  var modifiedMatch = req.body;

  return matchService.findById(req.params.id).then(handleEntityNotFound(res)).then(function (match) {
    if (match) {
      return matchService.updateMatch(match, modifiedMatch);
    }
  }).then(responseWithResult(res)).catch(handleError(res));
}

//private functions

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      logger.info('respondWithResult ' + entity._id);
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