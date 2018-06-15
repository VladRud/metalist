'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _match = require('../match/match.model');

var _match2 = _interopRequireDefault(_match);

var _seat = require('../seat/seat.model');

var _seat2 = _interopRequireDefault(_seat);

var _priceSchema = require('../priceSchema/priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Seats API:', function () {

  // add seats before testing
  before(function () {
    return _match2.default.remove({}).then(createPrice).then(createMatch).then(function (match) {
      return createSeats(match.id);
    }).then(createOtherMatch).then(function (match) {
      return createSeats(match.id);
    });
  });

  //Clear seats after testing
  after(function () {
    return _seat2.default.remove({}).then(function () {
      return _match2.default.remove({});
    }).then(function () {
      return _priceSchema2.default.remove({});
    });
  });

  describe('GET /api/seats/reserved-on-match/:id/sector/:sector', function () {
    it('GET should respond with a reserved seats by sector ', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/seats/reserved-on-match/' + matchId + '/sector/' + '9').expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.length(3);
        done();
      });
    });
    it('GET should respond with a reserved seats by sector for other match', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/seats/reserved-on-match/' + otherMatchId + '/sector/' + '9').expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.length(3);
        done();
      });
    });
  });
});

var matchId = void 0,
    otherMatchId = void 0,
    priceSchema = void 0;
var seats = [{
  slug: 's9r19st8',
  sector: '9',
  row: '19',
  seat: 8,
  reservedUntil: new Date('2019-04-27 14:56')
  //match: matchId
}, {
  slug: 's9r19st9',
  sector: '9',
  row: '19',
  seat: 9,
  reservedUntil: new Date('2019-03-25 14:56')
}, {
  slug: 's9r19st10',
  sector: '9',
  row: '19',
  seat: 10,
  reservedUntil: new Date('2019-04-25 14:56')
}, {
  slug: 's10r19st10',
  sector: '10',
  row: '19',
  seat: 10,
  reservedUntil: new Date('2019-04-25 14:56')
}];

function createSeats(id) {
  return Promise.all(createSeat(seats, id));
}

function createSeat(seats, id) {
  return seats.map(function (seat) {
    var newSeat = new _seat2.default({
      slug: seat.slug,
      sector: seat.sector,
      row: seat.row,
      seat: seat.seat,
      reservedUntil: seat.reservedUntil,
      match: id
    });

    return newSeat.save();
  });
}

function createMatch() {

  var newMatch = new _match2.default({
    rival: 'Dynamo',
    priceSchema: priceSchema,
    date: new Date('2019-04-25 14:56')
  });
  return newMatch.save().then(function (match) {
    matchId = match.id;
    return match;
  });
}

function createOtherMatch() {

  var newMatch = new _match2.default({
    rival: 'Dynamo',
    priceSchema: priceSchema,
    date: new Date('2019-05-25 14:56')
  });
  return newMatch.save().then(function (match) {
    otherMatchId = match.id;
    return match;
  });
}

function createPrice() {
  return _priceSchema2.default.remove({}).then(function () {
    var price = new _priceSchema2.default({
      priceSchema: {
        name: 'amators',
        tribune_west: {
          name: 'west',
          price: 20
        }
      }
    });
    return price.save().then(function (price) {
      priceSchema = price;
      return price;
    });
  });
}