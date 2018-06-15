'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.index = index;
exports.savePriceSchema = savePriceSchema;
exports.view = view;
exports.deletePrice = deletePrice;

var _priceSchema = require('./priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = log4js.getLogger('PriceSchema');

function index(req, res) {
  return _priceSchema2.default.find({}).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function savePriceSchema(req, res) {
  console.log('savePriceSchema', req.body);
  var priceSchema = req.body;
  console.log('savePriceSchema', priceSchema);
  _priceSchema2.default.findById(priceSchema.id).then(function (price) {
    if (!price) {
      var newPrice = new _priceSchema2.default({
        priceSchema: priceSchema
      });
      newPrice.priceSchema.id = newPrice.id;
      return newPrice.save();
    }
    price.priceSchema = priceSchema;
    return price.save();
  }).then(respondWithResult(res)).catch(handleError(res));
}

function view(req, res) {
  return _priceSchema2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

function deletePrice(req, res) {
  return _priceSchema2.default.findByIdAndRemove(req.params.id).exec().then(function () {
    res.status(204).end();
  }).catch(handleError(res));
}

//private functions

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      logger.info('respondWithResult ' + entity._id);
      return res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('handleError ' + err);
    res.status(statusCode).send(err);
  };
}