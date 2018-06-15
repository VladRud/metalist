'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');


var MatchSchema = new _mongoose.Schema({
  rival: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: null
  },
  priceSchema: { type: _mongoose.Schema.ObjectId, ref: 'PriceSchema' },
  info: String,
  stadiumName: String,
  poster: String,
  abonement: {
    type: Boolean,
    default: false
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

MatchSchema.virtual('headline').get(function () {
  return 'Металлист 1925 - ' + this.rival;
});

exports.default = _mongoose2.default.model('Match', MatchSchema);