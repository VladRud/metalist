'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getSeasonTickets = getSeasonTickets;
exports.getBlocks = getBlocks;
exports.createSeasonTicket = createSeasonTicket;
exports.confirmSeasonTicket = confirmSeasonTicket;
exports.deleteSeasonTicket = deleteSeasonTicket;
exports.blockRow = blockRow;
exports.deleteBlockRow = deleteBlockRow;

var _seasonTicket = require('../seasonTicket/seasonTicket.service');

var seasonTicketService = _interopRequireWildcard(_seasonTicket);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _seat = require('../seat/seat.constants');

var _objectid = require('mongoose/lib/types/objectid');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('SeasonTicket');

function getSeasonTickets(req, res) {
  return seasonTicketService.getActiveSeasonTickets().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function getBlocks(req, res) {
  return seasonTicketService.getActiveBlockTickets().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function createSeasonTicket(req, res) {
  var ticket = req.body.ticket;
  ticket.seat.push(req.params.slug);

  return seasonTicketService.findBySlug(ticket.seat.slug).then(function (seasonTicket) {
    if (seasonTicket && seasonTicket.reservedUntil > new Date()) {
      return res.status(409).end();
    }
    return seasonTicketService.createSeasonTicket(ticket.seat, ticket.reservedUntil).then(respondWithResult(res));
  }).catch(handleError(res));
}

function confirmSeasonTicket(req, res) {
  var ticketId = req.body.ticket,
      slug = req.params.slug;
  return Promise.all([seasonTicketService.findBySlug(slug), _user2.default.findOne({ tickets: new _objectid.ObjectId(ticketId) })]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        seasonTicket = _ref2[0],
        user = _ref2[1];

    if (!seasonTicket || !user) {
      return res.status(409).end();
    }
    seasonTicket.status = _seat.PAID;
    user.seasonTickets.push(seasonTicket);
    return Promise.all([user.save(), seasonTicket.save()]);
  }).then(respondWithResult(res)).catch(function (error) {
    return logger.error('registrationSeasonTicket error: ', error);
  });
}

function deleteSeasonTicket(req, res) {
  return seasonTicketService.removeBySlug(req.params.slug).then(function () {
    res.status(204).end();
  }).then(respondWithResult(res)).catch(handleError(res));
}

function blockRow(req, res) {
  var blockRow = req.body.blockRow,
      sector = req.body.blockRow.sector,
      row = req.body.blockRow.row;

  return Promise.all([seasonTicketService.getBlockedRowSeats(sector, row), seasonTicketService.getRowSeats(sector, row)]).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        tickets = _ref4[0],
        seats = _ref4[1];

    if (tickets.length) {
      tickets.forEach(function (ticket) {
        if (seats.includes(ticket.seat)) {
          seats.splice(seats.indexOf(ticket.seat), 1);
        }
      });
    }
    return seasonTicketService.createBlockRow(seats, blockRow);
  }).then(function () {
    return res.status(200).end();
  }).catch(handleError(res));
}

function deleteBlockRow(req, res) {
  var sector = req.params.sector,
      row = req.params.row;

  return seasonTicketService.getBlockRow(sector, row).then(seasonTicketService.removeBlockRow).then(respondWithResult(res)).catch(handleError(res));
}

// private functions ---------------------------------------
function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
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