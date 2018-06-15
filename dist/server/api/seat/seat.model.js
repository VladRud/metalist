'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _seat = require('./seat.constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');

var SeatSchema = new _mongoose.Schema({
  slug: { type: String, required: true },
  match: { type: _mongoose.Schema.Types.ObjectId, ref: 'Match' },
  price: { type: Number, required: true, default: 0 },
  tribune: { type: String },
  sector: { type: String, requried: true },
  row: { type: String, requried: true },
  seat: { type: Number, requried: true },
  reservedUntil: { type: Date },
  reservationType: { type: String, enum: [_seat.PAID, _seat.RESERVE] },
  reservedByCart: { type: String }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

SeatSchema.virtual('isReserved').get(function () {
  return this.reservedUntil > new Date();
});

exports.default = _mongoose2.default.model('Seat', SeatSchema);