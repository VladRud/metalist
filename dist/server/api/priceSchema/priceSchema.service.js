'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPriceSchemaById = findPriceSchemaById;
exports.getSeatPrice = getSeatPrice;

var _priceSchema = require('./priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _match = require('../match/match.service');

var matchService = _interopRequireWildcard(_match);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findPriceSchemaById(priceSchemaId) {
  return _priceSchema2.default.findOne({ _id: priceSchemaId });
}

function getSeatPrice(seat) {
  return matchService.findById(seat.match.id).then(function (match) {
    return findPriceSchemaById(match.priceSchema);
  }).then(function (priceSchema) {
    return getPrice(priceSchema, seat);
  });
}

function getPrice(priceSchema, seat) {
  var schema = priceSchema.priceSchema,
      tribuneName = seat.tribune,
      sectorName = seat.sector;

  if (!schema['tribune_' + tribuneName]) {
    throw new Error('Price not found');
  }
  if (schema['tribune_' + tribuneName]['sector_' + sectorName]) {
    var price = schema['tribune_' + tribuneName]['sector_' + sectorName].price;

    if (!price) {
      return schema['tribune_' + tribuneName].price;
    }
    return price;
  } else {
    return schema['tribune_' + tribuneName].price;
  }
}