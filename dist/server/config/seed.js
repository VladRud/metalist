/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var _user = require('../api/user/user.model');

var _user2 = _interopRequireDefault(_user);

var _ticket = require('../api/ticket/ticket.model');

var _ticket2 = _interopRequireDefault(_ticket);

var _match = require('../api/match/match.model');

var _match2 = _interopRequireDefault(_match);

var _priceSchema = require('../api/priceSchema/priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _order = require('../api/order/order.model');

var _order2 = _interopRequireDefault(_order);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_priceSchema2.default.find({}).remove().then(function () {
  console.log('finished populating PriceSchemas');
});

_match2.default.find({}).remove().then(function () {
  console.log('finished populating matches');
});

_order2.default.find({}).remove().then(function () {
  console.log('finished populating orders');
});

_user2.default.find({}).remove().then(function () {
  _user2.default.create({
    provider: 'local',
    name: 'Test User',
    email: 'test@example.com',
    password: 'test'
  }, {
    provider: 'local',
    name: 'Test Steward',
    email: 'steward@example.com',
    password: 'test'
  }, {
    provider: 'local',
    name: 'Test Cashier',
    email: 'cashier@example.com',
    password: 'test'
  }, {
    provider: 'local',
    name: 'Test User',
    email: 'test@example.com',
    password: 'test'
  }, {
    provider: 'local',
    role: 'admin',
    name: 'Admin',
    email: 'admin@example.com',
    password: 'admin'
  }).then(function () {
    console.log('finished populating users');
  });
});

_ticket2.default.find({}).remove().then(function () {
  console.log('finished populating tickets');
});