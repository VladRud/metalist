'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _util = require('../../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TicketSchema = new _mongoose2.default.Schema({
  cartId: {
    type: String
  },
  orderNumber: {
    type: String
  },
  accessCode: {
    type: String,
    required: true
  },
  seat: {
    id: { type: String, requried: true },
    tribune: { type: String, requried: true },
    sector: { type: String, requried: true },
    row: { type: String, requried: true },
    seat: { type: Number, requried: true }
  },
  match: {
    id: { type: String, requried: true },
    headline: { type: String, requried: true },
    date: { type: Date, requried: true }
  },
  userId: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  reserveDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['paid', 'used'],
    required: true
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  ticketNumber: {
    type: String,
    required: true
  },
  freeMessageStatus: {
    type: String,
    default: null
  },
  customPrice: {
    type: String,
    default: null
  }
});

exports.default = _mongoose2.default.model('Ticket', TicketSchema);