'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMailByOrder = sendMailByOrder;
exports.sendMailTemporaryPassword = sendMailTemporaryPassword;

var _nodemailer = require('nodemailer');

var nodemailer = _interopRequireWildcard(_nodemailer);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _environment = require('../config/environment');

var config = _interopRequireWildcard(_environment);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('sendMail'),
    transport = nodemailer.createTransport('smtps://' + config.mailer.auth.user + ':' + config.mailer.auth.pass + '@smtp.gmail.com');

function sendMailByOrder(order) {
  logger.info("Sending message to : " + order.user.email);
  var success = true;
  var mailOptions = {
    from: order.user.email,
    to: order.user.email,
    text: '',
    attachments: []
  };
  order.tickets.forEach(function (ticket) {
    var attach = {
      filename: 'MetalistTickets.pdf',
      path: config.domain + '/api/tickets/ticket/' + ticket.ticketNumber
    };

    if (!mailOptions.subject) {
      mailOptions.subject = ticket.match.headline + '. Дата: ' + (0, _moment2.default)(ticket.match.date).tz('Europe/Kiev').locale('ru').format('DD MMMM YYYY HH:mm');
    }
    mailOptions.attachments.push(attach);
  });

  transport.sendMail(mailOptions, function (error, response) {
    if (error) {
      logger.error('sendMail ' + error);
      success = false;
    } else {
      logger.info("[INFO] Message Sent: " + response.message);
    }
  });
}

function sendMailTemporaryPassword(to, password) {
  var success = true,
      mailOptions = {
    from: to,
    to: to,
    subject: 'Тимчасовий пароль',
    text: 'Ваш тимчасовий пароль ' + password
  };

  transport.sendMail(mailOptions, function (error) {
    if (error) {
      logger.error('sendMail ' + error);
      success = false;
    } else {
      logger.info("[INFO] Password sent");
    }
  });
}