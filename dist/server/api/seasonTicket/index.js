'use strict';

var _authService = require('../../auth/auth.service.js');

var auth = _interopRequireWildcard(_authService);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express');
var controller = require('./seasonTicket.controller.js');


var router = express.Router();

router.get('/season-tickets', auth.hasRole('cashier'), controller.getSeasonTickets);
router.get('/block-row', auth.hasRole('admin'), controller.getBlocks);

router.post('/:slug', auth.hasRole('admin'), controller.createSeasonTicket);
router.delete('/:slug', auth.hasRole('admin'), controller.deleteSeasonTicket);
router.post('/registration/:slug', auth.hasRole('cashier'), controller.confirmSeasonTicket);

router.post('/addBlock/sector/:sector/row/:row', auth.hasRole('admin'), controller.blockRow);
router.delete('/deleteBlock/sector/:sector/row/:row', auth.hasRole('admin'), controller.deleteBlockRow);

module.exports = router;