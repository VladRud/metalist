'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');


var PriceSchema = new _mongoose.Schema({
    priceSchema: {
        required: true,
        type: Object
    }
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

exports.default = _mongoose2.default.model('PriceSchema', PriceSchema);