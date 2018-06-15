'use strict';

var express = require('express');
var controller = require('./seat.controller.js');

var router = express.Router();

router.get('/reserved-on-match/:id/sector/:sector', controller.getReservedSeats);

module.exports = router;