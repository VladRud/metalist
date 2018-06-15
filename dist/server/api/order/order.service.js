'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getStatistics = getStatistics;
exports.getEventsStatistics = getEventsStatistics;
exports.findCartByPublicId = findCartByPublicId;
exports.getByPrivateId = getByPrivateId;
exports.getPendingPaymentByUser = getPendingPaymentByUser;
exports.createOrderFromCart = createOrderFromCart;
exports.createPaymentLink = createPaymentLink;
exports.processLiqpayRequest = processLiqpayRequest;
exports.getLiqPayParams = getLiqPayParams;
exports.createOrderFromCartByCashier = createOrderFromCartByCashier;
exports.createTicketsByOrder = createTicketsByOrder;

var _seat = require('../seat/seat.constants');

var _order = require('./order.model');

var _order2 = _interopRequireDefault(_order);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

var _priceSchema = require('../priceSchema/priceSchema.service');

var priceSchemeService = _interopRequireWildcard(_priceSchema);

var _seasonTicket = require('../seasonTicket/seasonTicket.service');

var seasonTicketService = _interopRequireWildcard(_seasonTicket);

var _seat2 = require('../seat/seat.service');

var seatService = _interopRequireWildcard(_seat2);

var _ticket = require('../ticket/ticket.service');

var ticketService = _interopRequireWildcard(_ticket);

var _liqpay = require('../../liqpay');

var LiqPay = _interopRequireWildcard(_liqpay);

var _environment = require('../../config/environment');

var config = _interopRequireWildcard(_environment);

var _mailer = require('../../mailer/mailer.js');

var Mailer = _interopRequireWildcard(_mailer);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var logger = log4js.getLogger('Order Service');

function getStatistics(userId, date) {
  var day = (0, _moment2.default)(new Date(date)).tz('Europe/Kiev');
  return _order2.default.find({
    "user.id": userId, created: {
      $gte: day.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
      $lt: day.endOf('day').format('YYYY-MM-DD HH:mm:ss')
    }
  }).sort({ created: -1 }).populate('tickets');
}

function getEventsStatistics() {
  var day = (0, _moment2.default)().subtract(45, 'days');
  var filtredTickets = [];
  return _order2.default.find({ status: 'paid', created: { $gte: day.startOf('day').format('YYYY-MM-DD HH:mm:ss') } }).populate('tickets').then(function (orders) {
    return orders.map(function (order) {
      return order.tickets.map(function (ticket) {
        return filtredTickets.push({
          cashier: !order.paymentDetails ? 'cashier' : 'user',
          headline: ticket.match.headline,
          sector: ticket.seat.sector,
          date: (0, _moment2.default)(ticket.match.date).tz('Europe/Kiev').format('YYYY-MM-DD HH:mm'),
          dateBuy: (0, _moment2.default)(ticket.reserveDate).tz('Europe/Kiev').format('YYYY-MM-DD'),
          amount: ticket.amount
        });
      });
    }, 0), filtredTickets;
  });
}

function findCartByPublicId(publicId) {
  return _order2.default.findOne({ publicId: publicId }).populate({
    path: 'seats',
    match: { reservationType: { $nin: [_seat.PAID] }, reservedUntil: { $gte: new Date() } },
    populate: { path: 'match' }
  });
}

function getByPrivateId(privateId) {
  return _order2.default.findOne({ privateId: privateId }).populate({
    path: 'seats',
    populate: { path: 'match' }
  });
}

function getPendingPaymentByUser(user) {
  return _order2.default.findOne({ "user.id": user.id, status: "pending", created: { $gte: (0, _moment2.default)().subtract(10, 'minutes') } });
}

function createOrderFromCart(cart, user) {
  return countPriceBySeats(cart.seats).then(function (price) {
    var order = new _order2.default({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      seats: cart.seats,
      type: 'order',
      status: 'pending',
      publicId: crypto.randomBytes(20).toString('hex'),
      privateId: ticketService.randomNumericString(8),
      created: new Date(),
      price: price
    });

    return order.save();
  });
}

function createPaymentLink(order) {
  var orderDescription = createDescription(order);

  var paymentParams = {
    'action': 'pay',
    'amount': order.price,
    'currency': 'UAH',
    'description': orderDescription.slice(0, 150),
    'order_id': order.publicId,
    'sandbox': config.liqpay.sandboxMode,
    'server_url': config.liqpay.callbackUrl,
    'result_url': config.liqpay.redirectUrl
  };

  return LiqPay.generatePaymentLink(paymentParams);
}

function processLiqpayRequest(request) {
  return getLiqPayParams(request).then(function (params) {
    return Promise.all([findCartByPublicId(params.order_id), params]);
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        order = _ref2[0],
        params = _ref2[1];

    if (!order) {
      throw new Error('Order not found');
    }
    order.paymentDetails = params;
    if (params.status === 'success' || params.status === 'sandbox') {
      order.status = 'paid';
      logger.info('paid order: ' + order);
      return handleSuccessPayment(order);
    } else {
      order.status = 'failed';
      return order.save();
    }
  }).catch(function (error) {
    logger.error('liqpayCallback error: ' + error);
  });
}

function getLiqPayParams(req) {
  return new Promise(function (resolve, reject) {
    if (!req.body.data || !req.body.signature) {
      return reject(new Error('data or signature missing'));
    }

    if (LiqPay.signString(req.body.data) !== req.body.signature) {
      return reject(new Error('signature is wrong'));
    }

    return resolve(JSON.parse(new Buffer(req.body.data, 'base64').toString('utf-8')));
  });
}

function createOrderFromCartByCashier(cart, user, freeMessageStatus, customPrice) {
  return countPriceBySeats(cart.seats).then(function (price) {
    var order = new _order2.default({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      seats: cart.seats,
      type: 'order',
      status: 'paid',
      publicId: crypto.randomBytes(20).toString('hex'),
      privateId: ticketService.randomNumericString(8),
      created: new Date(),
      price: freeMessageStatus ? 0 : price,
      freeMessageStatus: freeMessageStatus
    });

    return order.save();
  });
}

////////private function
function handleSuccessPayment(order) {
  return Promise.all([_user2.default.findOne({ _id: order.user.id }), createTicketsByOrder(order), seatService.reserveSeatsAsPaid(order.seats, order.seats[0].reservedByCart)]).then(function (_ref3) {
    var _user$tickets;

    var _ref4 = _slicedToArray(_ref3, 2),
        user = _ref4[0],
        tickets = _ref4[1];

    (_user$tickets = user.tickets).push.apply(_user$tickets, _toConsumableArray(tickets));
    order.tickets = tickets;
    return Promise.all([user.save(), order.save()]);
  }).then(function () {
    Mailer.sendMailByOrder(order);
    return true;
  }).catch(function (error) {
    logger.error('handleSuccessPayment error: ' + error);
  });
}

function createDescription(order) {
  var uniqueRival = getUniqueMatchRival(order.seats),
      matchesDescription = createMatchesDescription(uniqueRival, order.seats);

  return order.privateId + ' | ' + matchesDescription;
}

function createTicketsByOrder(order) {
  var freeMessageStatus = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var customPrice = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  return Promise.all(order.seats.map(function (seat) {
    if (seat.match.abonement) {
      seasonTicketService.createSeasonTicket(seat);
    }
    return ticketService.createTicket(seat, freeMessageStatus, customPrice);
  }));
}

function countPriceBySeats(seats) {
  return Promise.all(seats.map(function (seat) {
    return priceSchemeService.getSeatPrice(seat);
  })).then(function (prices) {
    return prices.reduce(function (sum, price) {
      return sum + price;
    }, 0);
  });
}

function getUniqueMatchRival(seats) {
  var rivals = seats.map(function (seat) {
    return seat.match.rival;
  });
  return [].concat(_toConsumableArray(new Set(rivals)));
}

function createMatchesDescription(uniqueRival, seats) {
  return uniqueRival.reduce(function (description, rival) {
    var count = seats.filter(function (seat) {
      return seat.match.rival === rival;
    }).length;

    return description + ' ' + rival + ': ' + count + ' \u0448\u0442. | ';
  }, '');
}