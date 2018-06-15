'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findById = findById;
exports.getNextMatches = getNextMatches;
exports.getPrevMatches = getPrevMatches;
exports.getNextMatch = getNextMatch;
exports.createMatch = createMatch;
exports.removeById = removeById;
exports.updateMatch = updateMatch;

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _match = require('./match.model');

var _match2 = _interopRequireDefault(_match);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findById(matchId) {
  return _match2.default.findOne({ _id: matchId }).populate("priceSchema");
}

function getNextMatches() {
  // Select matches with start time more than 2 hours before now(match time).
  // Match is considered as next even if it has just started and is playing at this time
  return _match2.default.find({
    $or: [{ date: { $gt: (0, _moment2.default)().subtract(2, 'h') } }, { date: null }]
  }).populate("priceSchema").sort({ date: 1 });
}

function getPrevMatches() {
  // Select matches with start time less than 2 hours before now.
  // Match is considered as previous if it has already ended.
  return _match2.default.find({ date: { $lt: (0, _moment2.default)().add(2, 'h') } }).sort({ date: -1 });
}

function getNextMatch() {
  // Select matches with start time more than 2 hours before now(match time).
  // Match is considered as next even if it started and is playing at this time
  return _match2.default.find({ date: { $gt: (0, _moment2.default)().subtract(2, 'h') } }).sort({ date: 1 }).then(function (matches) {
    return matches[0];
  });
}

function createMatch(newMatch) {
  var match = new _match2.default({
    rival: newMatch.rival,
    info: newMatch.info,
    poster: newMatch.poster,
    priceSchema: newMatch.priceSchema.id,
    stadiumName: newMatch.priceSchema.priceSchema.stadiumName,
    abonement: newMatch.abonement
  });
  return match.save();
}

function removeById(matchId) {
  return _match2.default.findByIdAndRemove(matchId);
}

function updateMatch(match, modifiedMatch) {
  match.round = modifiedMatch.round;
  match.rival = modifiedMatch.rival;
  match.date = modifiedMatch.date;
  match.poster = modifiedMatch.poster;
  match.info = modifiedMatch.info;
  match.abonement = modifiedMatch.abonement;
  match.priceSchema = modifiedMatch.priceSchema.id;

  return match.save();
}