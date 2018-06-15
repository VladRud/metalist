'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _ticket = require('../ticket/ticket.model');

var _seat = require('../seat/seat.model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');


var OrderSchema = new _mongoose.Schema({
  publicId: {
    type: String,
    required: true
  },
  privateId: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'paid', 'failed'],
    required: true,
    default: 'new'
  },
  type: {
    type: String,
    enum: ['order', 'cart'],
    required: true,
    default: 'cart'
  },
  paymentDetails: _mongoose.Schema.Types.Mixed,
  tickets: [{ type: _mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  seats: [{ type: _mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
  user: {
    id: String,
    email: String,
    name: String
  },
  created: {
    type: Date,
    default: Date.now
  },
  freeMessageStatus: {
    type: String,
    default: null
  },
  customPrice: {
    type: String,
    default: null
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
  usePushEach: true
});

OrderSchema.virtual('size').get(function () {
  return this.seats.length;
});

exports.default = _mongoose2.default.model('Order', OrderSchema);