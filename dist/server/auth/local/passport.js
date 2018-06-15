'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.setup = setup;

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportLocal = require('passport-local');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function localAuthenticate(User, email, password, done) {
    User.findOne({
        email: email.toLowerCase()
    }).exec().then(function (user) {
        if (!user) {
            return done(null, false, {
                message: 'Данный email не зарегистрирован.'
            });
        }
        if (user && user.provider !== 'local') {
            return done(null, false, {
                message: 'Данный email уже используется. Возможно, вы заходили через социальные сети.'
            });
        }
        user.authenticate(password, function (authError, authenticated) {
            if (authError) {
                return done(authError);
            }
            if (!authenticated) {
                return done(null, false, { message: 'auth.wrongPassword' });
            } else {
                return done(null, user);
            }
        });
    }).catch(function (err) {
        return done(err);
    });
}

function setup(User, config) {
    _passport2.default.use(new _passportLocal.Strategy({
        usernameField: 'email',
        passwordField: 'password' // this is the virtual field on the model
    }, function (email, password, done) {
        return localAuthenticate(User, email, password, done);
    }));
}