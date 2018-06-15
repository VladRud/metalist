'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getPaymentStatus = getPaymentStatus;
exports.getOrderByPrivateId = getOrderByPrivateId;
exports.checkout = checkout;
exports.liqpayRedirect = liqpayRedirect;
exports.liqpayCallback = liqpayCallback;
exports.payCashier = payCashier;

var _order = require('../order/order.service');

var orderService = _interopRequireWildcard(_order);

var _seat = require('../seat/seat.service');

var seatService = _interopRequireWildcard(_seat);

var _environment = require('../../config/environment');

var _environment2 = _interopRequireDefault(_environment);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('Order Controller');

function getPaymentStatus(req, res) {
  return orderService.getPendingPaymentByUser(req.user).then(function (order) {
    if (order) {
      return { status: true };
    } else {
      return { status: false };
    }
  }).then(respondWithResult(res)).catch(handleError(res));
}

function getOrderByPrivateId(req, res) {
  return orderService.getByPrivateId(req.params.privateId).then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function checkout(req, res) {
  var publicId = req.cookies.cart;

  return orderService.findCartByPublicId(publicId).then(handleEntityNotFound(res)).then(function (cart) {
    logger.info('checkout cart: ' + cart);
    return Promise.all([seatService.extendReservationTime(cart.seats, publicId), Promise.resolve(cart)]);
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        seats = _ref2[0],
        cart = _ref2[1];

    return orderService.createOrderFromCart(cart, req.user);
  }).then(function (order) {
    logger.info('checkout order: ' + order);
    return { 'paymentLink': orderService.createPaymentLink(order) };
  }).then(respondWithResult(res)).catch(handleError(res));
}

function liqpayRedirect(req, res) {
  if (_environment2.default.env === 'development') {
    orderService.processLiqpayRequest(req);
  }

  return orderService.getLiqPayParams(req).then(function (params) {
    if (params.status === 'success' || params.status === 'sandbox') {
      req.cookies.cart = '';
      return res.redirect('/tickets');
    } else {
      return res.redirect('/checkout');
    }
  });
}

function liqpayCallback(req, res) {
  return orderService.processLiqpayRequest(req).then(respondWithResult(res)).catch(handleError(res));
}

function payCashier(req, res) {
  var publicId = req.cookies.cart;
  var freeMessageStatus = req.body.freeMessageStatus;
  var customPrice = req.body.customPrice;
  return orderService.findCartByPublicId(publicId) // find currents order
  .then(handleEntityNotFound(res)).then(handleEntityWithoutTicketsAndSeats(res)).then(function (cart) {
    return Promise.all([seatService.reserveSeatsAsPaid(cart.seats, publicId), // long 30 min reserv
    Promise.resolve(cart)]);
  }).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        seats = _ref4[0],
        cart = _ref4[1];

    return orderService.createOrderFromCartByCashier(cart, req.user, freeMessageStatus); // new order pending
  }).then(function (order) {
    return Promise.all([orderService.createTicketsByOrder(order, freeMessageStatus, customPrice), Promise.resolve(order)]);
  }).then(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        tickets = _ref6[0],
        order = _ref6[1];

    order.tickets = tickets;
    return order.save();
  }).then(respondWithResult(res)).catch(handleError(res));
}

// private functions ---------------------

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

function handleEntityWithoutTicketsAndSeats(res) {
  return function (entity) {
    if (entity && entity.seats && !entity.seats.length && entity.tickets && !entity.tickets.length) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('Error 1: ' + err);
    if (err.message == 'notReservedSeat') {
      res.status(406).send(err);
    } else {
      res.status(err.statusCode || statusCode).send(err);
    }
  };
}