'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.createTicket = createTicket;
exports.getUserTickets = getUserTickets;
exports.getByTicketNumber = getByTicketNumber;
exports.getByAccessCode = getByAccessCode;
exports.randomNumericString = randomNumericString;

var _ticket = require('./ticket.model');

var _ticket2 = _interopRequireDefault(_ticket);

var _match = require('../match/match.model');

var _match2 = _interopRequireDefault(_match);

var _priceSchema = require('../priceSchema/priceSchema.service');

var priceSchemaService = _interopRequireWildcard(_priceSchema);

var _match3 = require('../match/match.service');

var matchService = _interopRequireWildcard(_match3);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createTicket(seat) {
  var freeMessageStatus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var customPrice = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  return Promise.all([priceSchemaService.getSeatPrice(seat), matchService.findById(seat.match)]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        price = _ref2[0],
        match = _ref2[1];

    var ticket = new _ticket2.default({
      accessCode: randomNumericString(16),
      match: {
        id: match.id,
        headline: match.headline,
        date: match.date
      },
      seat: {
        id: seat.id,
        tribune: seat.tribune,
        sector: seat.sector,
        row: seat.row,
        seat: seat.seat
      },
      amount: freeMessageStatus ? 0 : price,
      status: 'paid',
      ticketNumber: crypto.randomBytes(20).toString('hex'),
      reserveDate: new Date(),
      freeMessageStatus: freeMessageStatus,
      customPrice: customPrice
    });
    return ticket.save();
  });
}

function getUserTickets(tickets) {
  return getTicketsById(tickets, { 'match.date': { $gte: new Date() }, status: 'paid' }, { 'match.date': -1 });
}

function getByTicketNumber(ticketNumber) {
  return _ticket2.default.findOne({ ticketNumber: ticketNumber });
}

function getByAccessCode(accessCode) {
  console.log('accessCode', accessCode);
  return _ticket2.default.findOne({ accessCode: accessCode });
}

function randomNumericString(length) {
  var chars = '0123456789';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }return result;
}

function getTicketById(ticketId) {
  return _ticket2.default.findById(ticketId);
}

function getTicketsById(ids) {
  var optionParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var sortParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var options = Object.assign(optionParams, { '_id': { $in: ids } });
  return _ticket2.default.find(options).populate({
    path: 'match.id', model: _match2.default
  }).sort(sortParams);
}