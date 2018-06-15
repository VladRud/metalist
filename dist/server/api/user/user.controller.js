'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.index = index;
exports.create = create;
exports.show = show;
exports.destroy = destroy;
exports.setRole = setRole;
exports.changePassword = changePassword;
exports.me = me;
exports.generatePassword = generatePassword;
exports.recoveryPassword = recoveryPassword;
exports.authCallback = authCallback;

var _user = require('./user.model');

var _user2 = _interopRequireDefault(_user);

var _environment = require('../../config/environment');

var _environment2 = _interopRequireDefault(_environment);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

var _mailer = require('../../mailer/mailer.js');

var Mailer = _interopRequireWildcard(_mailer);

var _passwordGenerator = require('../../passwordGenerator');

var passwordGenerator = _interopRequireWildcard(_passwordGenerator);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = log4js.getLogger('User');

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    res.status(statusCode).json(err);
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('handleError ' + err);
    res.status(statusCode).send(err);
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
function index(req, res) {
  logger.debug("order index");
  return _user2.default.find({}, '-salt -password').sort({ role: 1 }).exec().then(function (users) {
    return res.status(200).json(users);
  }).catch(handleError(res));
}

/**
 * Creates a new user
 */
function create(req, res, next) {
  var newUser = new _user2.default(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save().then(function (user) {
    console.log('===create', user);
    var token = _jsonwebtoken2.default.sign({ _id: user._id }, _environment2.default.secrets.session, {
      expiresIn: 60 * 60 * 5
    });
    res.json({ token: token });
  }).catch(validationError(res));
}

/**
 * Get a single user
 */
function show(req, res, next) {
  var userId = req.params.id;

  return _user2.default.findById(userId).exec().then(function (user) {
    if (!user) {
      return res.status(404).end();
    }
    res.json(user.profile);
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
function destroy(req, res) {
  return _user2.default.findByIdAndRemove(req.params.id).exec().then(function () {
    res.status(204).end();
  }).catch(handleError(res));
}

/**
 * Change a user role
 */
function setRole(req, res) {
  var newRole = req.params.role;

  return _user2.default.findById(req.params.id).exec().then(function (user) {
    if (!user) {
      return res.status(404).end();
    }
    user.role = newRole;
    user.save().then(function () {
      res.status(204).end();
    });
  }).catch(handleError(res));
}

/**
 * Change a users password
 */
function changePassword(req, res, next) {
  var userId = req.user._id,
      oldPass = String(req.body.oldPassword),
      newPass = String(req.body.newPassword);

  return _user2.default.findById(userId).exec().then(function (user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      return user.save().then(function () {
        res.status(204).end();
      }).catch(validationError(res));
    } else {
      return res.status(403).end();
    }
  });
}

/**
 * Get my info
 */
function me(req, res, next) {
  var userId = req.user._id;

  return _user2.default.findOne({ _id: userId }, '-salt -password').exec().then(function (user) {
    // don't ever give out the password or salt
    if (!user) {
      return res.status(401).end();
    }
    return res.json(user);
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Generate temporary password
 */
function generatePassword(req, res, next) {
  var email = String(req.body.email),
      password = passwordGenerator.generatePassByMail(),
      newUser = {};
  return _user2.default.findOne({ email: email }).exec().then(function (user) {
    if (user && user.name) {
      return res.status(409).end();
    }
    if (user && !user.name) {
      newUser = user;
      newUser.password = password;
    }
    if (!user) {
      newUser = new _user2.default();
      newUser.email = email;
      newUser.password = password;
      newUser.provider = 'local';
    }

    newUser.save().then(function (newUser) {
      Mailer.sendMailTemporaryPassword(newUser.email, password);

      return res.status(200).json({ message: 'auth.temporaryPassword' });
    }).catch(function () {
      return res.status(500).json({ message: 'Что-то пошло не так... Попробуйте еще раз.' });
    });
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Reset forget password and send temporary password
 */
function recoveryPassword(req, res, next) {
  var email = String(req.body.email),
      password = passwordGenerator.generatePassByMail();

  return _user2.default.findOne({ email: email }).exec().then(function (user) {
    if (!user) {
      return res.status(200).json({ message: 'Данный имейл не зарегистрирован.' });
    } else if (user && user.provider !== 'local') {
      return res.status(200).json({ message: 'Не могу сбросить пароль. Возможно, вы заходили через социальные сети.' });
    } else {
      user.password = password;
    }

    user.save().then(function (user) {
      console.log('recovery');
      Mailer.sendMailTemporaryPassword(user.email, password);

      return res.status(200).json({ message: 'На ваш email был выслан временный пароль.' });
    }).catch(function () {
      return res.status(500).json({ message: 'Что-то пошло не так... Попробуйте еще раз.' });
    });
  }).catch(function (err) {
    return next(err);
  });
}

/**
 * Authentication callback
 */
function authCallback(req, res, next) {
  res.redirect('/');
}