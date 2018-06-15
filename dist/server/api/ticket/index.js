'use strict';

var _authService = require('../../auth/auth.service.js');

var auth = _interopRequireWildcard(_authService);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express'),
    controller = require('./ticket.controller');


var router = express.Router();

router.get('/ticket/:ticketNumber', controller.getTicketPdfById);
router.get('/my', auth.isAuthenticated(), controller.getMyTickets);

router.get('/abonticket/print/:accessCode', controller.print);
router.get('/abonticket/:accessCode', auth.hasRole('cashier'), controller.getTicketByAccessCode);
router.get('/useabonticket/:ticketId', auth.hasRole('cashier'), controller.useAbonementTicket);
router.get('/statistics', auth.hasRole('cashier'), controller.getStatistics);

router.get('/tribune/:tribune/code/:code', auth.hasRole('steward'), controller.use);
router.get('/sold-tickets', auth.hasRole('steward'), controller.getTicketsForCheckMobile);
router.get('/count/:tribune', auth.hasRole('steward'), controller.getCountValidTicketsByTribune);

router.delete('/:id', auth.hasRole('cashier'), controller.deleteTicketAndClearSeatReservationById);

module.exports = router;