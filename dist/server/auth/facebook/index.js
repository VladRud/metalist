'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _auth = require('../auth.service');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/', _passport2.default.authenticate('facebook', {
    scope: ['email'],
    failureRedirect: '/login'
})).get('/callback', _passport2.default.authenticate('facebook', {
    failureRedirect: '/login'
}), _auth.setFacebookTokenCookie);

exports.default = router;