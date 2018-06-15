'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getReservedSeats = getReservedSeats;

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

var _seat = require('./seat.service');

var seatService = _interopRequireWildcard(_seat);

var _seasonTicket = require('../seasonTicket/seasonTicket.service');

var seasonTicketService = _interopRequireWildcard(_seasonTicket);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('Seat');

function getReservedSeats(req, res) {
  var sector = req.params.sector,
      matchId = req.params.id;

  return Promise.all([seatService.getReservedSeats(matchId, sector), seasonTicketService.getActiveBlocksBySector(sector)]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        seats = _ref2[0],
        tickets = _ref2[1];

    var reservedTickets = seats.concat(tickets);
    return reservedTickets.map(function (ticket) {
      return ticket.slug;
    });
  }).then(respondWithResult(res)).catch(handleError(res));
}

//private functions
function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return res.status(statusCode).json(entity);
    }
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('Error: ' + err);
    res.status(err.statusCode || statusCode).send(err);
  };
}