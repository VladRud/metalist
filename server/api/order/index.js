'use strict';

var express = require('express');
var controller = require('./order.controller');

var router = express.Router();

router.post('/cart', controller.updateCart);
router.get('/cart', controller.getCart);
router.delete('/cart/items/:itemId', controller.deleteItemFromCart);

module.exports = router;