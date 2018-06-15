'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generatePaymentLink = generatePaymentLink;
exports.signString = signString;

var _environment = require('../config/environment');

var _environment2 = _interopRequireDefault(_environment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var crypto = require('crypto');


var publicKey = _environment2.default.liqpay.publicKey;
var privateKey = _environment2.default.liqpay.privateKey;
var apiEndpoint = 'https://www.liqpay.com/api/3/checkout';
var apiVersion = '3';

function generatePaymentLink(params) {
  params.public_key = publicKey;
  params.version = apiVersion;

  var data = paramsToDataString(params);
  var signature = signString(data);

  return apiEndpoint + '?data=' + data + '&signature=' + signature;
}

function signString(data) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(privateKey + data + privateKey);

  return sha1.digest('base64');
}

function paramsToDataString(params) {
  return new Buffer(JSON.stringify(params)).toString('base64');
}