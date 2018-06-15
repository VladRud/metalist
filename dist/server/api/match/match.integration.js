'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _match = require('../match/match.model');

var _match2 = _interopRequireDefault(_match);

var _priceSchema = require('../priceSchema/priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Match API:', function () {
  var matchId = void 0,
      priceSchema = void 0;
  //create priceSchema, match
  before(function () {
    return createPrice();
  });
  // Clear all after testing
  after(function () {
    return _priceSchema2.default.remove({}).then(function () {
      return _match2.default.remove({});
    });
  });

  describe('Match life cycle', function () {
    var usedMatch = {
      rival: 'Zarja',
      info: '12356',
      poster: 'assets/teamLogos/6.png',
      priceSchema: priceSchema,
      date: new Date('2017-04-10 14:56')
    };

    it('POST /api/matches/: should respond with a status 200 and new match', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/matches').send({
        rival: 'Dynamo',
        info: '123',
        poster: 'assets/teamLogos/3.png',
        priceSchema: priceSchema,
        date: new Date('2019-04-25 14:56')
      }).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          matchId = res.body.id;

          res.body.rival.toString().should.equal('Dynamo');
          res.body.should.have.property('headline');
          res.body.headline.toString().should.equal('Металлист 1925 - Dynamo');
          res.body.info.toString().should.equal('123');
          ///res.body.date.toString().should.equal('2019-04-25T11:56:00.000Z');
          res.body.priceSchema.toString().should.equal(priceSchema.id);

          done();
        }
      });
    });

    it('GET /api/matches/:id : should respond with a match consist of params id', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/matches/' + matchId).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.rival.toString().should.equal('Dynamo');
        res.body.should.have.property('headline');
        res.body.headline.toString().should.equal('Металлист 1925 - Dynamo');
        res.body.info.toString().should.equal('123');
        //res.body.date.toString().should.equal('2019-04-25T11:56:00.000Z');
        res.body.priceSchema.id.toString().should.equal(priceSchema.id);

        done();
      });
    });

    it('PUT /api/matches/:id : should respond with a status 200 and update match', function (done) {
      (0, _supertest2.default)(_2.default).put('/api/matches/' + matchId).send({
        rival: 'Dynamo',
        info: '456',
        poster: 'assets/teamLogos/3.png',
        priceSchema: priceSchema,
        date: new Date('2019-05-10 19:25')
      }).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.rival.toString().should.equal('Dynamo');
          res.body.should.have.property('headline');
          res.body.headline.toString().should.equal('Металлист 1925 - Dynamo');
          res.body.info.toString().should.equal('456');
          //res.body.date.toString().should.equal('2019-05-10T16:25:00.000Z');
          res.body.priceSchema.toString().should.equal(priceSchema.id);
          done();
        }
      });
    });

    it('DELETE /api/matches/:id : should respond with a status 204', function (done) {
      (0, _supertest2.default)(_2.default).delete('/api/matches/' + matchId).expect(204).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('GET /api/matches/next: should respond with a status 200 and empty array', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/matches/next').expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.should.be.instanceof(Array).and.have.lengthOf(0);

          done();
        }
      });
    });
  });

  describe('Matches output', function () {
    before(function () {
      return createMatches();
    });

    it('GET /api/matches/next: should respond with a status 200 and next matches', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/matches/next').expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.should.be.instanceof(Array).and.have.lengthOf(2);

          done();
        }
      });
    });
  });

  var matches = [{
    rival: 'Zarja',
    info: '12356',
    poster: 'assets/teamLogos/6.png',
    priceSchema: priceSchema,
    date: new Date('2017-04-10 14:56')
  }, {
    rival: 'Dynamo',
    info: '123',
    poster: 'assets/teamLogos/3.png',
    priceSchema: priceSchema,
    date: new Date('2019-04-25 14:56')
  }, {
    rival: 'Victoria',
    info: '258',
    poster: 'assets/teamLogos/4.png',
    priceSchema: priceSchema
  }];

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

  function createMatches() {
    return _match2.default.remove({}).then(function () {
      return Promise.all(createMatch(matches));
    });
  }

  function createMatch(matches) {
    return matches.map(function (match) {
      var newMatch = new _match2.default({
        rival: match.rival,
        info: match.info,
        poster: match.poster,
        priceSchema: match.priceSchema,
        date: match.date
      });
      return newMatch.save();
    });
  }
});