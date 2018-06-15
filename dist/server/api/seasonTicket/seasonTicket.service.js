'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getActiveSeasonTickets = getActiveSeasonTickets;
exports.getSeasonTicketsByIds = getSeasonTicketsByIds;
exports.getActiveBlockTickets = getActiveBlockTickets;
exports.getActiveBlocksBySector = getActiveBlocksBySector;
exports.findBySlug = findBySlug;
exports.removeBySlug = removeBySlug;
exports.createSeasonTicket = createSeasonTicket;
exports.getBlockedRowSeats = getBlockedRowSeats;
exports.getRowSeats = getRowSeats;
exports.createBlockRow = createBlockRow;
exports.removeBlockRow = removeBlockRow;
exports.getBlockRow = getBlockRow;

var _seat = require('../seat/seat.constants');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _stadium = require('../../stadium');

var _seasonTicket = require('./seasonTicket.model');

var _seasonTicket2 = _interopRequireDefault(_seasonTicket);

var _ticket = require('../ticket/ticket.service');

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function getActiveSeasonTickets() {
  return _seasonTicket2.default.find({ reservedUntil: { $gte: new Date() }, reservationType: _seat.SEASON_TICKET });
}

function getSeasonTicketsByIds(seasonTicketsIds) {
  return _seasonTicket2.default.find({ '_id': { $in: seasonTicketsIds } });
}

function getActiveBlockTickets() {
  return _seasonTicket2.default.find({ reservedUntil: { $gte: new Date() }, reservationType: _seat.BLOCK });
}

function getActiveBlocksBySector(sector) {
  return _seasonTicket2.default.find({ reservedUntil: { $gte: new Date() }, sector: sector });
}

function findBySlug(slug) {
  console.log('slug', slug);
  return _seasonTicket2.default.findOne({ slug: slug });
}

function removeBySlug(slug) {
  return _seasonTicket2.default.remove({ slug: slug });
}

function createSeasonTicket(seat) {
  var reservedUntil = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0, _moment2.default)().add(2, 'y');

  var newTicket = new _seasonTicket2.default({
    slug: seat.slug,
    sector: seat.sector,
    row: seat.row,
    seat: seat.seat,
    tribune: seat.tribune,
    reservedUntil: reservedUntil,
    reservationType: _seat.SEASON_TICKET,
    accessCode: (0, _ticket.randomNumericString)(16),
    status: _seat.RESERVE
  });

  return newTicket.save();
}

function getBlockedRowSeats(sector, row) {
  return _seasonTicket2.default.find({ sector: sector, row: row, reservedUntil: { $gte: new Date() } });
}

function getRowSeats(sectorName, rowName) {
  return new _bluebird2.default(function (resolve, reject) {
    var tribuneName = getTribuneName(sectorName),
        _Stadium$rows$filter = _stadium.Stadium['tribune_' + tribuneName]['sector_' + sectorName].rows.filter(function (row) {
      return row.name === rowName;
    }),
        _Stadium$rows$filter2 = _slicedToArray(_Stadium$rows$filter, 1),
        stadiumRow = _Stadium$rows$filter2[0],
        stadiumSeats = [].concat(_toConsumableArray(Array(parseInt(stadiumRow.seats) + 1).keys())).filter(Boolean);


    if (stadiumSeats.length) {
      resolve(stadiumSeats);
    } else {
      reject(new Error('stadiumSeats not found.'));
    }
  });
}

function createBlockRow(seats, blockRow) {
  return _bluebird2.default.all(seats.map(function (seat) {
    return createBlockRowTicket(seat, blockRow);
  }));
}

function removeBlockRow(tickets) {
  return _bluebird2.default.all(tickets.map(function (ticket) {
    return removeBySlug(ticket.slug);
  }));
}

function getBlockRow(sector, row) {
  return _seasonTicket2.default.find({ sector: sector, row: row, reservationType: _seat.BLOCK });
}

////// private function
function getTribuneName(sectorName) {
  var tribuneName = void 0,
      tribune = void 0;

  for (tribune in _stadium.Stadium) {
    if (_stadium.Stadium[tribune]['sector_' + sectorName]) {
      tribuneName = _stadium.Stadium[tribune].name;
    }
  }
  return tribuneName;
}

function createBlockRowTicket(seat, blockRow) {
  var slug = 's' + blockRow.sector + 'r' + blockRow.row + 'st' + seat;

  var newTicket = new _seasonTicket2.default({
    slug: slug,
    sector: blockRow.sector,
    row: blockRow.row,
    seat: seat,
    reservedUntil: blockRow.reservedUntil,
    reservationType: _seat.BLOCK
  });

  return newTicket.save();
}