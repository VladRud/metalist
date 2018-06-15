'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _seasonTicket = require('../seasonTicket/seasonTicket.model');

var _seasonTicket2 = _interopRequireDefault(_seasonTicket);

var _user = require('../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Season ticket API:', function () {
  var token = void 0,
      ticket = void 0,
      slug = void 0;

  // Clear users before testing
  before(function () {
    return _seasonTicket2.default.remove({}).then(createUser);
  });

  //Clear seats after testing
  after(function () {
    return _user2.default.remove({}).then(function () {
      return _seasonTicket2.default.remove({});
    });
  });

  describe('GET /api/seasonTicket/', function () {
    ticket = {
      sector: '10',
      row: '19',
      seat: '8',
      reservedUntil: (0, _moment2.default)().add(1, 'days')
    };
    slug = 's9r19st8';

    before(function (done) {
      (0, _supertest2.default)(_2.default).post('/auth/local').send({
        email: 'admin@example.com',
        password: 'admin'
      }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        token = res.body.token;
        done();
      });
    });

    it('POST /api/seasonTicket/:slug should respond with a create seat', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/seasonTicket/' + slug).set('authorization', 'Bearer ' + token).send({ ticket: ticket }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.sector.toString().should.equal('10');
        res.body.row.toString().should.equal('19');
        res.body.seat.toString().should.equal('8');
        done();
      });
    });

    it('POST should respond with 409', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/seasonTicket/' + slug).set('authorization', 'Bearer ' + token)
      //.type('json')
      .send({ ticket: ticket }).expect(409).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET should respond with a seat', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/seasonTicket/season-tickets').set('authorization', 'Bearer ' + token).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.length(1);
        done();
      });
    });

    it('DELETE should respond with a status 204 when seat are deleted', function (done) {
      (0, _supertest2.default)(_2.default).delete('/api/seasonTicket/' + slug).set('authorization', 'Bearer ' + token).expect(204).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET /api/seasonTicket/: should respond with a empty array when there are no seats', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/seasonTicket/season-tickets').set('authorization', 'Bearer ' + token).expect(200).end(function (err, res) {
        res.body.should.have.length(0);
        done();
      });
    });
  });

  describe('GET /api/seasonTicket/addBlock/sector/:sector/row/:row', function () {
    var blockRow = {
      sector: '10',
      row: '19',
      reservedUntil: (0, _moment2.default)().add(1, 'days')
    };

    before(function (done) {
      (0, _supertest2.default)(_2.default).post('/auth/local').send({
        email: 'admin@example.com',
        password: 'admin'
      }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        token = res.body.token;
        done();
      });
    });

    it('POST to /api/seasonTicket/: should respond with a create season seat', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/seasonTicket/' + slug).set('authorization', 'Bearer ' + token).send({ ticket: ticket }).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.sector.toString().should.equal('10');
        res.body.row.toString().should.equal('19');
        res.body.seat.toString().should.equal('8');
        done();
      });
    });

    it('POST to /api/seasonTicket/addBlock/: should respond with a create block row seat without season-tickets', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/seasonTicket/addBlock/sector/' + blockRow.sector + '/row/' + blockRow.row).set('authorization', 'Bearer ' + token).send({ blockRow: blockRow }).expect(200).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('DELETE /api/seasonTicket/deleteBlock/: should respond with a status 204 when block row seats are deleted', function (done) {
      (0, _supertest2.default)(_2.default).delete('/api/seasonTicket/deleteBlock/sector/' + blockRow.sector + '/row/' + blockRow.row).set('authorization', 'Bearer ' + token).expect(200).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET /api/seasonTicket: should respond with a season-ticket seat', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/seasonTicket/season-tickets').set('authorization', 'Bearer ' + token).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.length(1);
        res.body[0].sector.toString().should.equal('10');
        res.body[0].row.toString().should.equal('19');
        res.body[0].seat.should.equal(8);
        res.body[0].reservationType.should.equal('SEASON_TICKET');
        done();
      });
    });
  });
});

function createUser() {
  return _user2.default.remove({}).then(function () {
    var user = new _user2.default({
      name: 'Fake Admin',
      email: 'admin@example.com',
      password: 'admin',
      provider: 'local',
      role: 'admin'
    });

    return user.save();
  });
}