'use strict';
import * as barcode from 'bwip-js';
import * as fs from 'fs';
import moment from 'moment';
import * as log4js from 'log4js';

let logger = log4js.getLogger('createPdfFile'),
  PDFDocument = require('pdfkit');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    logger.error('getTicketPdfById '+err);
    res.status(statusCode).send(err);
  };
}

function translite(direction) {
  if (direction == 'north') { return 'Север'}
  if (direction == 'south') { return 'Юг'}
  if (direction == 'east') { return 'Восток'}
  if (direction == 'west') { return 'Запад'}
}


let generateBarcodePng = (ticket) =>{
  return new Promise((resolve, reject) => {
    barcode.toBuffer({
      bcid:        'code128',
      text:        String(ticket.accessCode),
      scale:       3,               // 3x scaling factor
      height:      10,              // Bar height, in millimeters
      includetext: true,            // Show human-readable text
      textxalign:  'center',        // Always good to set this
      textsize:    13               // Font size, in points
    }, function (err, png) {
      if (err) {
        return reject(err);
      } else {
        return resolve(png);
      }
    });
  });
};

let generatePdfPage = (res, ticket, png) => {
  let doc = new PDFDocument();
  doc.pipe(res);
  doc.image(__dirname + '/ticket.png', 10, 0, {width: 500});
  doc.font(__dirname + '/fonts/OpenSans-Bold.ttf');
  doc.fontSize(10)


    .text('Трибуна: ', 350, 45)
    .text('Сектор: ', 350, 65)
    .text('Ряд: ', 350, 85)
    .text('Мiсце: ', 350, 105)

  doc.fontSize(16)
    .text( moment(ticket.match.date).format('DD.MM.YYYY HH:mm'), 20, 10, {align: 'center'})
    .text( ticket.match.headline, 20, 140, {align: 'center'})
    .text( translite(ticket.seat.tribune), 410, 39)
    .text( ticket.seat.sector, 410, 60)
    .text( ticket.seat.row, 410, 81)
    .text( ticket.seat.number, 410, 102);

  doc.fontSize(9)
    .text('ОСК "Металiст"\n м. Харкiв\n вул. Плеханiвська, 65\n \n Цiна:  ' + ticket.amount/100 + ' грн.', -245, 53, {align: 'center'});

  doc.rotate(90)
    .image(png, 25, -90, {width: 140});

  doc
    .fontSize(11)
    .text('ЧЕМПІОНАТ УКРАЇНИ\n З ФУТБОЛУ СЕРЕД\n АМАТОРСЬКИХ\n КОМАНД 2016-2017', -350, -530 ,{align: 'center'});

  doc.end();
}
let createPdfFilePipe = (ticket, png, res) => {
  return new Promise((resolve) => {
    generatePdfPage(res, ticket, png);
    return resolve(res);
  });
};

export function generateTicket(ticket, res) {
  return generateBarcodePng(ticket)
    .then(png => {
      return createPdfFilePipe(ticket, png, res);
    })
    .catch(handleError(res));
}
