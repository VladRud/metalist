'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getReservedSeats = getReservedSeats;
exports.getByMatchId = getByMatchId;
exports.findForMatchBySlug = findForMatchBySlug;
exports.findSeatOrCreate = findSeatOrCreate;
exports.extendReservationTime = extendReservationTime;
exports.reserveSeatsAsPaid = reserveSeatsAsPaid;
exports.clearReservation = clearReservation;
exports.findByCartAndMatchId = findByCartAndMatchId;
exports.reserveSeatAsReserve = reserveSeatAsReserve;
exports.createSeatsForMatch = createSeatsForMatch;
exports.deleteByMatchId = deleteByMatchId;

var _seat = require('../seat/seat.constants');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _metalist = require('../../stadium/metalist');

var _dinamo = require('../../stadium/dinamo');

var _solar = require('../../stadium/solar');

var _seat2 = require('../seat/seat.model');

var _seat3 = _interopRequireDefault(_seat2);

var _match = require('../match/match.service');

var matchService = _interopRequireWildcard(_match);

var _priceSchema = require('../priceSchema/priceSchema.service');

var priceSchemaService = _interopRequireWildcard(_priceSchema);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function getReservedSeats(matchId, sector) {
  return _seat3.default.find({ reservedUntil: { $gte: new Date() }, match: matchId, sector: sector });
}

function getByMatchId(matchId) {
  return _seat3.default.find({ match: matchId });
}

function findForMatchBySlug(slug, matchId) {
  return _seat3.default.findOne({ slug: slug, match: matchId }).populate('match');
}

function findSeatOrCreate(slug, matchId, data) {
  return findForMatchBySlug(slug, matchId).then(function (seat) {
    if (seat) {
      return seat;
    } else {
      var tribune = data.tribune,
          sector = data.sector,
          row = data.row;

      if (!seatExists(tribune, sector, row, data.seat)) {
        return null;
      }
      return createSeat(tribune, sector, { name: row }, data.seat, { id: matchId }).then(function () {
        return findForMatchBySlug(slug, matchId);
      }).then(function (seat) {
        return seat;
      });
    }
  });
}

function extendReservationTime(seats, reservedByCart) {
  return _bluebird2.default.all(seats.map(function (seat) {
    return findForMatchBySlug(seat.slug, seat.match.id).then(function (seat) {
      if (seat.reservedByCart !== reservedByCart && seat.reservationType !== 'PAID') {
        throw new Error('notReservedSeat');
      }
      seat.reservedUntil = (0, _moment2.default)().add(30, 'minutes');
      return seat.save();
    });
  }));
}

//@TODO need (включить в запрос expired_date - Время до которого клиент может оплатить счет по UTC. Передается в формате 2016-04-24 00:00:00) также имеет смысл в  ограничении разового заказа на не более скажем 40 мест
function reserveSeatsAsPaid(seats, reservedByCart) {
  return _bluebird2.default.all(seats.map(function (seat) {
    return _bluebird2.default.all([findForMatchBySlug(seat.slug, seat.match), matchService.findById(seat.match)]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          seat = _ref2[0],
          match = _ref2[1];

      if (seat.reservedByCart !== reservedByCart && seat.reservationType !== 'PAID') {
        throw new Error('notReservedSeat');
      }
      seat.reservedUntil = (0, _moment2.default)(match.date).add(1, 'days');
      seat.reservationType = _seat.PAID;
      return seat.save();
    });
  }));
}

function clearReservation(seat) {
  seat.reservedByCart = '';
  seat.reservedUntil = (0, _moment2.default)().subtract(10, 'minutes');

  return seat.save();
}

function findByCartAndMatchId(publicId, slug, matchId) {
  return _seat3.default.findOne({ reservedByCart: publicId, slug: slug, match: matchId });
}

function reserveSeatAsReserve(seat, reserveDate, publicId) {
  return priceSchemaService.getSeatPrice(seat).then(function (price) {
    if (!price) {
      throw new Error("price not found");
    }
    seat.reservedByCart = publicId;
    seat.reservedUntil = reserveDate;
    seat.reservationType = _seat.RESERVE;
    seat.price = price;

    return seat.save();
  });
}

function createSeatsForMatch(match) {
  console.log("-----------------------/// add seats for match: ", match.id);

  return createStadiumSeatsForMatch(match).catch(function (err) {
    if (err) {
      throw new Error(err);
    }
  });
}

function deleteByMatchId(matchId) {
  console.log("-----------------------/// delete seats for previous match: ", matchId);
  return _seat3.default.deleteMany({ match: matchId });
}

// private function
function createStadiumSeatsForMatch(match) {
  console.log("createStadiumSeatsForMatch(match)  ", match);
  var parameters = [];

  if (match.stadiumName === 'metalist') {
    (function () {
      var Stadium = _metalist.StadiumMetalist;

      var _loop = function _loop(tribune) {
        var _loop2 = function _loop2(sector) {
          if (Stadium[tribune][sector].rows) {
            Stadium[tribune][sector].rows.forEach(function (row) {
              parameters.push({
                tribune: Stadium[tribune].name,
                sector: Stadium[tribune][sector].name,
                row: row,
                match: match
              });
            });
          }
        };

        for (var sector in Stadium[tribune]) {
          _loop2(sector);
        }
      };

      for (var tribune in Stadium) {
        _loop(tribune);
      }
    })();
  } else {
    if (match.stadiumName == 'solar') {
      (function () {
        var Stadium = _solar.StadiumSolar;

        var _loop3 = function _loop3(tribune) {
          var _loop4 = function _loop4(sector) {
            if (Stadium[tribune][sector].rows) {
              Stadium[tribune][sector].rows.forEach(function (row) {
                parameters.push({
                  tribune: Stadium[tribune].name,
                  sector: Stadium[tribune][sector].name,
                  row: row,
                  match: match
                });
              });
            }
          };

          for (var sector in Stadium[tribune]) {
            _loop4(sector);
          }
        };

        for (var tribune in Stadium) {
          _loop3(tribune);
        }
      })();
    } else {
      (function () {
        var Stadium = _dinamo.StadiumDinamo;

        var _loop5 = function _loop5(tribune) {
          var _loop6 = function _loop6(sector) {
            if (Stadium[tribune][sector].rows) {
              Stadium[tribune][sector].rows.forEach(function (row) {
                parameters.push({
                  tribune: Stadium[tribune].name,
                  sector: Stadium[tribune][sector].name,
                  row: row,
                  match: match
                });
              });
            }
          };

          for (var sector in Stadium[tribune]) {
            _loop6(sector);
          }
        };

        for (var tribune in Stadium) {
          _loop5(tribune);
        }
      })();
    }
  }

  //for (let tribune in Stadium) {
  //  for (let sector in Stadium[tribune]) {
  //    if (Stadium[tribune][sector].rows) {
  //      Stadium[tribune][sector].rows.forEach(row => {
  //        parameters.push({tribune: Stadium[tribune].name, sector: Stadium[tribune][sector].name, row: row, match: match});
  //      })
  //    }
  //  }
  //}
  return _bluebird2.default.map(parameters, function (_ref3) {
    var tribune = _ref3.tribune,
        sector = _ref3.sector,
        row = _ref3.row,
        match = _ref3.match;

    return createRowSeats(tribune, sector, row, match);
  }, { concurrency: 1 }).then(function () {
    console.log("-----------------------/// add seats for match have done: ", match.id);
    return "done";
  });
}

function getRowSeats(seats) {
  return new _bluebird2.default(function (resolve) {
    var resultArray = [];
    if (seats.includes(',') || seats.includes('-')) {
      seats.split(',').map(function (interval) {
        var intervalBoundaries = interval.split('-');
        var start = intervalBoundaries[0];
        var end = intervalBoundaries[1];
        resultArray.push.apply(resultArray, _toConsumableArray(Array(end - start + 1).fill(0).map(function (_, id) {
          return parseInt(start) + parseInt(id);
        })));
      });
    } else {
      resultArray.push.apply(resultArray, _toConsumableArray(Array(parseInt(seats) + 1).keys()));
    }
    resolve(resultArray);
  });
}

function createRowSeats(tribuneName, sectorName, row, match) {
  return getRowSeats(row.seats).then(function (seats) {
    var parameters = [];
    seats.forEach(function (seat) {
      parameters.push({ tribune: tribuneName, sector: sectorName, row: row, seat: seat, match: match });
    });
    return _bluebird2.default.map(parameters, function (_ref4) {
      var tribune = _ref4.tribune,
          sector = _ref4.sector,
          row = _ref4.row,
          seat = _ref4.seat,
          match = _ref4.match;

      return createSeat(tribune, sector, row, seat, match);
    }, { concurrency: 1 }).then(function () {
      console.log("-----------------------/// add row seats have done: sector - " + sectorName + ' ,row - ' + row.name);
      return "done";
    });
  });
}

function createSeat(tribuneName, sectorName, row, seat, match) {
  var slug = 's' + sectorName + 'r' + row.name + 'st' + seat;
  var newSeat = new _seat3.default({
    slug: slug,
    match: match.id,
    tribune: tribuneName,
    sector: sectorName,
    row: row.name,
    seat: seat,
    reservedUntil: new Date(),
    reservedByCart: ''
  });

  return newSeat.save();
}

function removeSeatByMatchId(matchId) {
  return _seat3.default.remove({ match: matchId });
}

function seatExists(tribune, sector, row, seat) {
  var tribuneData = _metalist.StadiumMetalist['tribune_' + tribune];
  var sectorData = tribuneData && tribuneData['sector_' + sector];
  var rowsData = sectorData && sectorData.rows;
  return rowsData && rowsData.find(function (_ref5) {
    var name = _ref5.name,
        seats = _ref5.seats;
    return name === row && seat <= seats;
  });
}