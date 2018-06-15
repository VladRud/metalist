'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateTicket = generateTicket;

var _bwipJs = require('bwip-js');

var barcode = _interopRequireWildcard(_bwipJs);

var _fs = require('fs');

var fs = _interopRequireWildcard(_fs);

var _momentTimezone = require('moment-timezone');

var _momentTimezone2 = _interopRequireDefault(_momentTimezone);

var _log4js = require('log4js');

var log4js = _interopRequireWildcard(_log4js);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var logger = log4js.getLogger('createPdfFile'),
    PDFDocument = require('pdfkit');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('getTicketPdfById ' + err);
    res.status(statusCode).send(err);
  };
}

function translate(direction) {
  if (direction === 'north') {
    return 'Северная';
  }
  if (direction === 'south') {
    return 'Южная';
  }
  if (direction === 'east') {
    return 'Восточная';
  }
  if (direction === 'west') {
    return 'Западная';
  }
}

var generateBarcodePng = function generateBarcodePng(ticket) {
  return new Promise(function (resolve, reject) {
    barcode.toBuffer({
      bcid: 'code128',
      text: String(ticket.accessCode),
      scale: 3, // 3x scaling factor
      height: 10, // Bar height, in millimeters
      includetext: true, // Show human-readable text
      textxalign: 'center', // Always good to set this
      textsize: 13 // Font size, in points
    }, function (err, png) {
      if (err) {
        return reject(err);
      } else {
        return resolve(png);
      }
    });
  });
};

var generatePdfPage = function generatePdfPage(res, ticket, png) {
  var doc = new PDFDocument();
  doc.pipe(res);
  doc.image('./server/ticket.png', 10, 0, { width: 500 });
  doc.font('./server/OpenSans-Bold.ttf');

  doc.fontSize(10).text('Трибуна: ', 350, 45).text('Сектор: ', 350, 65).text('Ряд: ', 350, 85).text('Место: ', 350, 105);

  doc.fontSize(14).text((0, _momentTimezone2.default)(ticket.match.date).tz("Europe/Kiev").format('DD.MM.YYYY HH:mm'), 8, 15, { align: 'center' });

  doc.fontSize(13).text(ticket.match.headline, 20, 140, { align: 'center' }).text(translate(ticket.seat.tribune), 400, 42).text(ticket.seat.sector, 400, 63).text(ticket.seat.row, 400, 81).text(ticket.seat.seat, 400, 102);

  doc.fontSize(9).text('ОСК "Металлист"\n г. Харьков\n ул. Плехановская, 65\n \n Цена:  ' + ticket.amount + ' грн.', -245, 53, { align: 'center' });
  // .text('стадион "Солнечный"\n (Харьков,\n пос. Пятихатки,\n Белгородское шоссе\n \n Цена:  ' + ticket.amount + ' грн.', -245, 53, {align: 'center'});

  doc.rotate(90).image(png, 25, -90, { width: 140 });

  doc.fontSize(11).text('ЧЕМПИОНАТ УКРАИНЫ\n СРЕДИ КОМАНД\n ВТОРОЙ ЛИГИ', -350, -510, { align: 'center' });

  doc.end();
};
var createPdfFilePipe = function createPdfFilePipe(ticket, png, res) {
  return new Promise(function (resolve) {
    generatePdfPage(res, ticket, png);
    return resolve(res);
  });
};

function generateTicket(ticket, res) {
  return generateBarcodePng(ticket).then(function (png) {
    return createPdfFilePipe(ticket, png, res);
  }).catch(handleError(res));
}