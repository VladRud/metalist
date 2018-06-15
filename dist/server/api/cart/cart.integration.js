'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _match = require('../match/match.model');

var _match2 = _interopRequireDefault(_match);

var _order = require('../order/order.model');

var _order2 = _interopRequireDefault(_order);

var _priceSchema = require('../priceSchema/priceSchema.model');

var _priceSchema2 = _interopRequireDefault(_priceSchema);

var _seat = require('../seat/seat.model');

var _seat2 = _interopRequireDefault(_seat);

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Cart API:', function () {
  var publicId = void 0,
      matchId = void 0,
      priceId = void 0;
  //create priceSchema, match and seat
  before(function () {
    return createPrice().then(createMatch).then(createSeat);
  });
  // Clear all after testing
  after(function () {
    return _order2.default.remove({}).then(function () {
      return _priceSchema2.default.remove({});
    }).then(function () {
      return _match2.default.remove({});
    }).then(function () {
      return _seat2.default.remove({});
    });
  });

  describe('GET /api/carts/', function () {

    it('GET /api/carts/my-cart: should respond with a status 404 when cart not exists', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/carts/my-cart').expect(404).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('POST /api/carts/: should respond with a cart with new public id and default fields', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/carts/').expect(200).expect('Content-Type', /json/).end(function (err, res) {
        publicId = res.body.publicId;

        res.body.price.should.equal(0);
        res.body.should.have.property('publicId');
        res.body.status.toString().should.equal('new');
        res.body.type.toString().should.equal('cart');
        res.body.should.have.property('tickets').with.lengthOf(0);
        res.body.should.have.property('seats').with.lengthOf(0);
        res.body.should.have.property('created');

        done();
      });
    });

    it('GET /api/carts/my-cart: should respond with cart when cookie cart exists', function (done) {
      (0, _supertest2.default)(_2.default).get('/api/carts/my-cart').set('Cookie', 'cart=' + publicId).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.price.should.equal(0);
          res.body.publicId.toString().should.equal(publicId);
          res.body.status.toString().should.equal('new');
          res.body.type.toString().should.equal('cart');
          res.body.should.have.property('tickets').with.lengthOf(0);
          res.body.should.have.property('seats').with.lengthOf(0);
          res.body.should.have.property('created');
          done();
        }
      });
    });
  });

  describe('POST /api/carts/addSeat', function () {

    it('POST /api/carts/addSeats: should respond with a status 200 and update cart', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/carts/addSeat').send({
        slug: 's9r19st8',
        matchId: matchId
      }).set('Cookie', 'cart=' + publicId).expect(200).end(function (err, res) {
        if (err) {
          done(err);
        } else {
          res.body.seats[0].price.toString().should.equal('20');
          res.body.seats[0].reservedByCart.toString().should.equal(publicId);
          res.body.seats[0].reservationType.toString().should.equal('RESERVE');
          res.body.seats[0].isReserved.toString().should.equal('true');
          res.body.size.should.equal(1);
          res.body.price.should.equal(0);
          res.body.should.have.property('publicId');
          res.body.status.toString().should.equal('new');
          res.body.type.toString().should.equal('cart');
          res.body.should.have.property('tickets').with.lengthOf(0);
          res.body.should.have.property('seats').with.lengthOf(1);
          res.body.should.have.property('created');
          done();
        }
      });
    });

    it('POST /api/carts/addSeats: should respond with a status 409 when seat already taken.', function (done) {
      (0, _supertest2.default)(_2.default).post('/api/carts/addSeat').send({
        slug: 's9r19st8',
        matchId: matchId
      }).set('Cookie', 'cart=' + publicId).expect(409).end(function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });

    it('DELETE /api/carts/match/:matchId/seat/:slug : should respond with a cart with seats length null', function (done) {
      (0, _supertest2.default)(_2.default).delete('/api/carts/match/' + matchId + '/seat/s9r19st8').set('Cookie', 'cart=' + publicId).expect(200).expect('Content-Type', /json/).end(function (err, res) {
        res.body.should.have.property('publicId');
        res.body.price.should.equal(0);
        res.body.status.toString().should.equal('new');
        res.body.type.toString().should.equal('cart');
        res.body.should.have.property('tickets').with.lengthOf(0);
        res.body.should.have.property('seats').with.lengthOf(0);
        res.body.should.have.property('created');
        done();
      });
    });
  });
  function createSeat() {
    return _seat2.default.remove({}).then(function () {
      var seat = new _seat2.default({
        slug: 's9r19st8',
        tribune: 'west',
        sector: '9',
        row: '19',
        seat: 8,
        match: matchId,
        reservedUntil: new Date()
      });
      return seat.save();
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
        priceId = price.id;
        return price;
      });
    });
  }

  function createMatch() {
    return _match2.default.remove({}).then(function () {
      var match = new _match2.default({
        rival: 'Dynamo',
        info: '123',
        priceSchema: priceId,
        date: new Date()
      });
      return match.save().then(function (match) {
        matchId = match.id;
        return match;
      });
    });
  }
});