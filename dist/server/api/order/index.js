'use strict';

var _auth = require('../../auth/auth.service');

var auth = _interopRequireWildcard(_auth);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express');
var controller = require('./order.controller');


var router = express.Router();

router.post('/checkout', auth.isAuthenticated(), controller.checkout);
router.get('/order/:privateId', controller.getOrderByPrivateId);
router.post('/pay-cashier', auth.hasRole('cashier'), controller.payCashier);
router.get('/payment-status', auth.isAuthenticated(), controller.getPaymentStatus);
router.post('/liqpay-redirect', controller.liqpayRedirect);
router.post('/liqpay-callback', controller.liqpayCallback);

module.exports = router;