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

router.post('/', function (req, res, next) {
    _passport2.default.authenticate('local', function (err, user, info) {
        var error = err || info;
        if (error) {
            return res.status(401).json(error);
        }
        if (!user) {
            return res.status(404).json({ message: 'Something went wrong, please try again.' });
        }

        req.login(user, function (error) {
            if (error) {
                return res.status(500).json(error);
            }

            var token = (0, _auth.signToken)(user._id, user.role);
            return res.json({ token: token });
        });
    })(req, res, next);
});

router.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            return res.status(200).json({ message: 'Session destroy.' });
        }
    });
});

exports.default = router;