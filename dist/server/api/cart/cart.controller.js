'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.createCart = createCart;
exports.getCart = getCart;
exports.addSeatToCart = addSeatToCart;
exports.deleteSeatFromCart = deleteSeatFromCart;

var _order = require('../order/order.model');

var _order2 = _interopRequireDefault(_order);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _seat = require('../seat/seat.constants');

var _seat2 = require('../seat/seat.service');

var seatService = _interopRequireWildcard(_seat2);

var _order3 = require('../order/order.service');

var orderService = _interopRequireWildcard(_order3);

var _seasonTicket = require('../seasonTicket/seasonTicket.service');

var seasonTicketService = _interopRequireWildcard(_seasonTicket);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = log4js.getLogger('Cart');

function createCart(req, res) {
  var publicId = crypto.randomBytes(20).toString('hex');
  var cart = new _order2.default({
    type: 'cart',
    publicId: publicId
  });

  return cart.save().then(function (cart) {
    // req.session.cart = cart.publicId;
    // logger.info('set cart to session: ' + req.session.cart);
    return cart;
  }).then(respondWithResult(res)).catch(handleError(res));
}

function getCart(req, res) {
  res.setHeader('Last-Modified', new Date().toUTCString());
  res.setHeader('Cache-Control', 'no-cache, no-store');
  var publicId = req.cookies.cart;
  logger.info('get cart form cookies: ' + req.cookies.cart);

  orderService.findCartByPublicId(publicId).then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function addSeatToCart(req, res) {
  var publicId = req.cookies.cart,
      slug = req.body.slug,
      matchId = req.body.matchId,
      data = req.body.data,
      reserveDate = (0, _moment2.default)().add(30, 'minutes');
  logger.info('add seat to cart: ' + req.cookies.cart);

  Promise.all([orderService.findCartByPublicId(publicId), seatService.findSeatOrCreate(slug, matchId, data), seasonTicketService.findBySlug(slug)]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 3),
        cart = _ref2[0],
        seat = _ref2[1],
        seasonTicket = _ref2[2];

    if (!cart) {
      throw new Error('Cart not found');
    }
    if (!seat) {
      throw new Error('Seat not found');
    }
    if (seat.isReserved) {
      return res.status(409).end();
    }
    if (seasonTicket && seasonTicket.reservedUntil > new Date()) {
      return res.status(409).end();
    }
    return seatService.reserveSeatAsReserve(seat, reserveDate, cart.publicId)
    // find cart with updated seats result due to changes in seat reservation
    // in previous promise
    .then(function (seat) {
      return orderService.findCartByPublicId(publicId).then(function (cart) {
        return [seat, cart];
      });
    }).then(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
          seat = _ref4[0],
          cart = _ref4[1];

      // check if seat id already exists in cart seats list in order to
      // eliminate duplications
      var match = cart.seats.find(function (id) {
        return id.equals(seat.id);
      });
      if (!match) {
        cart.seats.push(seat.id);
      }
      return cart.save();
    }).then(function (cart) {
      return orderService.findCartByPublicId(cart.publicId);
    }).then(respondWithResult(res));
  }).catch(handleError(res));
}

function deleteSeatFromCart(req, res) {
  var publicId = req.cookies.cart,
      slug = req.params.slug,
      matchId = req.params.matchId;

  return orderService.findCartByPublicId(publicId).then(handleEntityNotFound(res)).then(function (cart) {
    return deleteReserveSeatFromCart(cart, slug, matchId);
  }).then(function (cart) {
    return seatService.findByCartAndMatchId(cart.publicId, slug, matchId).then(function (seat) {
      if (seat && seat.reservationType === _seat.RESERVE) {
        seatService.clearReservation(seat);
      }
      return cart;
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
    logger.error('Error: ' + err);
    res.status(err.statusCode || statusCode).send(err);
  };
}

function deleteReserveSeatFromCart(cart, slug, matchId) {
  cart.seats = cart.seats.filter(function (seat) {
    return !(seat.slug === slug && seat.match.id === matchId);
  });
  return cart.save();
}