'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _seat = require('../seat/seat.constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');

var SeasonTicketSchema = new _mongoose.Schema({
  slug: { type: String, required: true },
  sector: { type: String, requried: true },
  row: { type: String, requried: true },
  tribune: { type: String, requried: true },
  seat: { type: Number, requried: true },
  reservedUntil: { type: Date },
  reservationType: { type: String, enum: [_seat.BLOCK, _seat.SEASON_TICKET] },
  reservedByCart: { type: String },
  status: { type: String, enum: [_seat.BLOCK, _seat.PAID, _seat.RESERVE] },
  accessCode: {
    type: String,
    required: true,
    default: 0
  }
});

exports.default = _mongoose2.default.model('SeasonTicket', SeasonTicketSchema);