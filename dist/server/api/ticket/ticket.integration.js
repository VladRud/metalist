'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _ticket = require('../ticket/ticket.model');

var _ticket2 = _interopRequireDefault(_ticket);

var _seat = require('../seat/seat.model');

var _seat2 = _interopRequireDefault(_seat);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _match = require('../match/match.model');

var _match2 = _interopRequireDefault(_match);

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

var _crypto = require('crypto');

var crypto = _interopRequireWildcard(_crypto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

describe('Ticket API:', function () {
  var token = void 0;

  // Clear users before testing
  before(function () {
    return createMatch().then(function (match) {
      return Promise.all([createSeat(newSeats), Promise.resolve(match)]);
    }).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          seats = _ref2[0],
          match = _ref2[1];

      return createTickets(seats, match);
    }).then(createUser);
  });

  //Clear seats after testing
  after(function () {
    return _user2.default.remove({}).then(function () {
      return _seat2.default.remove({});
    }).then(function () {
      return _match2.default.remove({});
    }).then(function () {
      return _ticket2.default.remove({});
    });
  });

  describe('GET /api/tickets', function () {

    before(function (done) {
      (0, _supertest2.default)(_2.default).post('/auth/local').send({
        email: 'user@example.com',
        password: 'user'
      }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        token = res.body.token;
        done();
      });
    });

    after(function () {
      return createStewardUser();
    });

    it('GET /api/tickets/my: should respond with a user tickets', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/my').set('authorization', 'Bearer ' + token).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.length(2);
        done();
      });
    });

    it('GET /api/tickets/sold-tickets : should respond with 403', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/sold-tickets').set('authorization', 'Bearer ' + token).expect(403).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET /api/tickets/tribune/:tribune/code/:code : should respond with 403', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/tribune/' + 'west' + '/code/' + 'code').set('authorization', 'Bearer ' + token).expect(403).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET /api/tickets/count/:tribune : should respond with 403', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/count/' + 'west').set('authorization', 'Bearer ' + token).expect(403).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });

  describe('GET tickets for steward', function () {

    before(function (done) {
      (0, _supertest2.default)(_2.default).post('/auth/local').send({
        email: 'steward@example.com',
        password: 'steward'
      }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        token = res.body.token;
        done();
      });
    });

    after(function () {
      _user2.default.remove({});
      _ticket2.default.remove({});
      return true;
    });

    it('GET /api/tickets/sold-tickets : should respond with sold tickets', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/sold-tickets').set('authorization', 'Bearer ' + token).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.should.have.length(3);
          done();
        }
      });
    });

    it('GET /api/tickets/tribune/:tribune/code/:code : should respond with message "Другая трибуна"', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/tribune/' + 'east' + '/code/' + 's91910').set('authorization', 'Bearer ' + token).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.ticket.headLine.toString().should.equal('Металлист 1925 - Dynamo');
          res.body.ticket.tribune.toString().should.equal('west');
          res.body.ticket.row.toString().should.equal('19');
          res.body.ticket.sector.toString().should.equal('9');
          res.body.ticket.seat.toString().should.equal('10');
          res.body.count.toString().should.equal('1');
          res.body.message.toString().should.equal('Другая трибуна');
          done();
        }
      });
    });

    it('GET /api/tickets/tribune/:tribune/code/:code : should respond with status 200', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/tribune/west/code/s91910').set('authorization', 'Bearer ' + token).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.ticket.headLine.toString().should.equal('Металлист 1925 - Dynamo');
          res.body.ticket.tribune.toString().should.equal('west');
          res.body.ticket.row.toString().should.equal('19');
          res.body.ticket.sector.toString().should.equal('9');
          res.body.ticket.seat.toString().should.equal('10');
          res.body.should.have.property('count');
          done();
        }
      });
    });

    it('GET /api/tickets/tribune/:tribune/code/:code : should respond with message "Билет не действительный."', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/tickets/tribune/west/code/s91910').set('authorization', 'Bearer ' + token).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.count.toString().should.equal('0');
          res.body.message.toString().should.equal('Билет не действительный.');
          done();
        }
      });
    });
  });
  var matchId = void 0;
  var newSeats = [{
    slug: 's9r19st8',
    tribune: 'east',
    sector: '22',
    row: '19',
    seat: 8,
    reservedUntil: new Date('2019-04-27 14:56'),
    match: matchId
  }, {
    slug: 's9r19st10',
    tribune: 'west',
    sector: '9',
    row: '19',
    seat: 10,
    reservedUntil: new Date('2019-04-25 14:56'),
    match: matchId
  }, {
    slug: 's10r19st10',
    tribune: 'north',
    sector: '10',
    row: '19',
    seat: 10,
    reservedUntil: new Date('2019-04-25 14:56'),
    match: matchId
  }];

  function createStewardUser() {
    return _user2.default.remove({}).then(function () {
      var user = new _user2.default({
        name: 'Fake Steward',
        email: 'steward@example.com',
        password: 'steward',
        provider: 'local',
        role: 'steward'
      });

      return user.save();
    });
  }

  function createUser(tickets) {
    var _tickets = _toArray(tickets),
        one = _tickets[0],
        userTickets = _tickets.slice(1);

    return _user2.default.remove({}).then(function () {
      var user = new _user2.default({
        name: 'User',
        email: 'user@example.com',
        password: 'user',
        provider: 'local',
        role: 'user',
        tickets: userTickets
      });

      return user.save();
    });
  }

  function createMatch() {
    var newMatch = new _match2.default({
      rival: 'Dynamo',
      info: '123',
      poster: 'assets/teamLogos/3.png',
      date: new Date('2019-05-20 14:56')
    });
    return newMatch.save().then(function (match) {
      matchId = match.id;
      return match;
    });
  }

  function createSeat(seats) {
    return Promise.all(seats.map(function (seat) {
      var newSeat = new _seat2.default({
        slug: seat.slug,
        tribune: seat.tribune,
        sector: seat.sector,
        row: seat.row,
        seat: seat.seat,
        reservedUntil: seat.reservedUntil,
        matchId: seat.matchId
      });
      return newSeat.save();
    }));
  }

  function createTickets(seats, match) {
    return _ticket2.default.remove({}).then(function () {
      return Promise.all(createTicket(seats, match));
    });
  }

  function createTicket(seats, match) {
    return seats.map(function (seat) {
      var code = 's' + seat.sector + seat.row + seat.seat;
      var newTicket = new _ticket2.default({
        seat: {
          id: seat.id,
          tribune: seat.tribune,
          sector: seat.sector,
          row: seat.row,
          seat: seat.seat
        },
        accessCode: code,
        amount: 40,
        status: 'paid',
        ticketNumber: crypto.randomBytes(20).toString('hex'),
        match: {
          id: match.id,
          headline: match.headline,
          date: match.date
        }
      });
      return newTicket.save();
    });
  }
});