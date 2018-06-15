'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getTicketPdfById = getTicketPdfById;
exports.getTicketByAccessCode = getTicketByAccessCode;
exports.getMyTickets = getMyTickets;
exports.use = use;
exports.useAbonementTicket = useAbonementTicket;
exports.getTicketsForCheckMobile = getTicketsForCheckMobile;
exports.getCountValidTicketsByTribune = getCountValidTicketsByTribune;
exports.print = print;
exports.getStatistics = getStatistics;
exports.deleteTicketAndClearSeatReservationById = deleteTicketAndClearSeatReservationById;

var _ticket = require('./ticket.model');

var _ticket2 = _interopRequireDefault(_ticket);

var _seat = require('../seat/seat.model');

var _seat2 = _interopRequireDefault(_seat);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _bwipJs = require('bwip-js');

var barcode = _interopRequireWildcard(_bwipJs);

var _ticket3 = require('../ticket/ticket.service');

var ticketService = _interopRequireWildcard(_ticket3);

var _order = require('../order/order.service');

var orderService = _interopRequireWildcard(_order);

var _match = require('../match/match.service');

var matchService = _interopRequireWildcard(_match);

var _pdfGenerator = require('../../pdfGenerator');

var pdfGenerator = _interopRequireWildcard(_pdfGenerator);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

var _seat3 = require('../seat/seat.service');

var _seasonTicket = require('../seasonTicket/seasonTicket.service');

var seasonTicketService = _interopRequireWildcard(_seasonTicket);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var logger = log4js.getLogger('Ticket');
var sectorsInVip = ['VIP_B', 'VIP_BR', 'VIP_BL', 'VIP_AR', 'VIP_AL', 'SB_1', 'SB_7'];

function getTicketPdfById(req, res) {
  return ticketService.getByTicketNumber(req.params.ticketNumber).then(handleEntityNotFound(res)).then(function (ticket) {
    if (ticket) {
      return generatePdfTicket(ticket, res);
    }
  }).catch(handleError(res));
}

function getTicketByAccessCode(req, res) {
  return ticketService.getByAccessCode(req.params.accessCode).then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function getMyTickets(req, res) {
  return _user2.default.findById(req.user.id).then(function (user) {
    return Promise.all([ticketService.getUserTickets(user.tickets), seasonTicketService.getSeasonTicketsByIds(user.seasonTickets)]);
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        tickets = _ref2[0],
        seasonTickets = _ref2[1];

    return {
      'tickets': tickets.filter(function (ticket) {
        return ticket;
      }),
      'seasonTickets': seasonTickets.filter(function (seasonTicket) {
        return seasonTicket;
      })
    };
  }).then(respondWithResult(res)).catch(handleError(res));
}

function adminStatistics(req, res) {
  return orderService.getEventsStatistics().then(respondWithResult(res)).catch(handleError(res));
}

function use(req, res, next) {
  var code = req.params.code,
      tribune = req.params.tribune;

  return Promise.all([getTicketByCode(code), getCountTicketsByTribune(tribune)]).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        ticket = _ref4[0],
        count = _ref4[1];

    console.log('ticket', ticket, count);
    if (!ticket) {
      return res.status(200).json({ count: count, message: 'Билет не действительный.' });
    }
    var result = {
      ticket: getFormattedTicket(ticket),
      count: count
    };
    if (tribune === 'vip') {
      if (!sectorsInVip.includes(ticket.seat.sector)) {
        result.message = "Другая трибуна";
        return res.status(200).json(result);
      }
      ticket.status = 'used';
      return ticket.save().then(function () {
        return res.status(200).json(result);
      });
    } else {
      if (ticket.seat.tribune !== tribune || ticket.seat.tribune === tribune && sectorsInVip.includes(ticket.seat.sector)) {
        result.message = "Другая трибуна";
        return res.status(200).json(result);
      }
      ticket.status = 'used';
      return ticket.save().then(function () {
        return res.status(200).json(result);
      });
    }
  }).catch(handleError(res));
}

function useAbonementTicket(req, res) {
  return _ticket2.default.findById(req.params.ticketId).exec().then(handleEntityNotFound(res)).then(function (ticket) {
    ticket.status = 'used';
    return ticket.save().then(function () {
      return res.status(200).json(ticket);
    });
  }).catch(handleError(res));
}

function getTicketsForCheckMobile(req, res) {

  return getNextMatchTickets().then(function (tickets) {
    var result = tickets.map(function (ticket) {
      return {
        'status': ticket.status,
        'code': ticket.accessCode,
        'tribune': ticket.seat.tribune,
        'sector': ticket.seat.sector,
        'row': ticket.seat.row,
        'seat': ticket.seat.seat,
        'headline': ticket.match.headline
      };
    });

    return res.status(200).json(result);
  }).catch(handleError(res));
}

function getCountValidTicketsByTribune(req, res, next) {
  var tribune = req.params.tribune;

  return getCountTicketsByTribune(tribune).then(function (count) {
    return res.status(200).json(count);
  }).catch(handleError(res));
}

function print(req, res, next) {
  return _ticket2.default.findOne({ accessCode: req.params.accessCode }).exec().then(handleEntityNotFound(res)).then(function (ticket) {
    if (ticket) {

      barcode.toBuffer({
        bcid: 'code128', // Barcode type
        text: ticket.accessCode, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: false, // Show human-readable text
        textxalign: 'center' // Always good to set this
      }, function (err, png) {
        if (err) {
          return res.status(500).send('Could not generate ticket');
        }
        return res.status(200).json({ img: png.toString('base64') });
      });
    }
  }).catch(handleError(res));
}

function getStatistics(req, res) {
  if (req.query.metod === 'day') {
    dayStatistics(req, res);
  }
  if (req.query.metod === 'event') {
    eventStatistics(req, res);
  }
  if (req.query.metod === 'admin') {
    adminStatistics(req, res);
  }
}

function dayStatistics(req, res) {
  return orderService.getStatistics(req.user.id, req.query.date).then(function (order) {
    var tickets = [];
    return order.reduce(function (sum, current) {
      return current.tickets.map(function (ticket) {
        return tickets.push({
          headline: ticket.match.headline,
          amount: ticket.amount,
          date: (0, _momentTimezone2.default)(ticket.reserveDate).format('MMM D, YYYY')
        });
      });
    }, 0), tickets;
  }).then(function (tickets) {
    var amounts = tickets.map(function (ticket) {
      return ticket.amount;
    });
    return [].concat(_toConsumableArray(new Set(amounts))).map(function (amount) {
      var price = { price: amount };
      price.sum = tickets.filter(function (ticket) {
        return ticket.amount === amount;
      }).map(function (ticket) {
        return ticket.amount;
      }).reduce(function (sum, current) {
        return sum + current;
      }, 0);
      price.count = tickets.filter(function (ticket) {
        return ticket.amount === amount;
      }).map(function (ticket) {
        return ticket.amount;
      }).length;
      return price;
    });
  }).then(respondWithResult(res)).catch(handleError(res));
}

function eventStatistics(req, res) {
  // return orderService.getStatistics(req.user.id, req.query.date )
  return orderService.getStatistics(req.user.id, req.query.date).then(function (order) {
    var tickets = [];
    return order.reduce(function (sum, current) {
      return current.tickets.map(function (ticket) {
        return tickets.push({
          match: ticket.match,
          tribune: ticket.seat.tribune,
          sector: ticket.seat.sector,
          row: ticket.seat.row,
          seat: ticket.seat.seat,
          amount: ticket.amount,
          accessCode: ticket.accessCode,
          id: ticket.id,
          freeMessageStatus: ticket.freeMessageStatus,
          customPrice: ticket.customPrice
        });
      });
    }, 0), tickets;
  }).then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function deleteTicketAndClearSeatReservationById(req, res) {
  return _ticket2.default.findOne({ _id: req.params.id }).then(function (ticket) {
    return _seat2.default.findOne({ _id: ticket.seat.id });
  }).then(function (seat) {
    return Promise.all([_ticket2.default.findByIdAndRemove(req.params.id).exec(),
    // set seat reservedUntil property less than date now in order to
    // exclude seat from reserved on match seats
    (0, _seat3.clearReservation)(seat)]);
  }).then(function () {
    return res.status(204).end();
  }).catch(handleError(res));
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
    logger.error('handleError ' + err);
    res.status(statusCode).send(err);
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

function getNextMatchTickets() {
  return Promise.all([matchService.getNextMatch(), _ticket2.default.find({ status: 'paid' })]).then(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        match = _ref6[0],
        tickets = _ref6[1];

    return tickets.filter(function (ticket) {
      return ticket.match.id === match.id;
    });
  });
}

function generatePdfTicket(ticket, res) {
  return new Promise(function (resolve, reject) {
    pdfGenerator.generateTicket(ticket, res, function (err, res) {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
}

function getFormattedTicket(ticket) {
  return {
    'tribune': ticket.seat.tribune,
    'sector': ticket.seat.sector,
    'row': ticket.seat.row,
    'seat': ticket.seat.seat,
    'headLine': ticket.match.headline
  };
}

function getTicketByCode(code) {
  var dateNow = new Date();

  return _ticket2.default.findOne({ accessCode: code, status: 'paid' });
  // .where({
  //   $and: [
  //     {'valid.from': {$lte: dateNow}},
  //     {'valid.to': {$gt: dateNow}}
  //   ]
  // });
}

function getCountTicketsByTribune(tribune) {
  var dateNow = new Date();

  return getNextMatchTickets()
  /*.where({$and: [
   {'valid.from': { $lte: dateNow }},
   {'valid.to': { $gt: dateNow }}
   ]})*/
  .then(function (tickets) {
    if (tribune === 'vip') {
      return tickets.filter(function (ticket) {
        return sectorsInVip.includes(ticket.seat.sector);
      }).length;
    }
    return tickets.filter(function (ticket) {
      return ticket.seat.tribune === tribune && !sectorsInVip.includes(ticket.seat.sector);
    }).length;
  });
}