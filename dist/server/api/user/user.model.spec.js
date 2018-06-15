'use strict';

var _ = require('../..');

var _2 = _interopRequireDefault(_);

var _user = require('./user.model');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var user;
var genUser = function genUser() {
    user = new _user2.default({
        provider: 'local',
        name: 'Fake User',
        email: 'test@example.com',
        password: 'password'
    });
    return user;
};

describe('User Model', function () {
    before(function () {
        // Clear users before testing
        return _user2.default.remove();
    });

    beforeEach(function () {
        genUser();
    });

    afterEach(function () {
        return _user2.default.remove();
    });

    it('should begin with no users', function () {
        return _user2.default.find({}).exec().should.eventually.have.length(0);
    });

    it('should fail when saving a duplicate user', function () {
        return user.save().then(function () {
            var userDup = genUser();
            return userDup.save();
        }).should.be.rejected;
    });

    describe('#email', function () {
        it('should fail when saving with a blank email', function () {
            user.email = '';
            return user.save().should.be.rejected;
        });

        it('should fail when saving with a null email', function () {
            user.email = null;
            return user.save().should.be.rejected;
        });

        it('should fail when saving without an email', function () {
            user.email = undefined;
            return user.save().should.be.rejected;
        });

        describe('given user provider is google', function () {
            beforeEach(function () {
                user.provider = 'google';
            });

            it('should succeed when saving without an email', function () {
                user.email = null;
                return user.save().should.be.fulfilled;
            });
        });

        describe('given user provider is facebook', function () {
            beforeEach(function () {
                user.provider = 'facebook';
            });

            it('should succeed when saving without an email', function () {
                user.email = null;
                return user.save().should.be.fulfilled;
            });
        });

        describe('given user provider is github', function () {
            beforeEach(function () {
                user.provider = 'github';
            });

            it('should succeed when saving without an email', function () {
                user.email = null;
                return user.save().should.be.fulfilled;
            });
        });
    });

    describe('#password', function () {
        it('should fail when saving with a blank password', function () {
            user.password = '';
            return user.save().should.be.rejected;
        });

        it('should fail when saving with a null password', function () {
            user.password = null;
            return user.save().should.be.rejected;
        });

        it('should fail when saving without a password', function () {
            user.password = undefined;
            return user.save().should.be.rejected;
        });

        describe('given the user has been previously saved', function () {
            beforeEach(function () {
                return user.save();
            });

            it('should authenticate user if valid', function () {
                user.authenticate('password').should.be.true;
            });

            it('should not authenticate user if invalid', function () {
                user.authenticate('blah').should.not.be.true;
            });

            it('should remain the same hash unless the password is updated', function () {
                user.name = 'Test User';
                return user.save().then(function (u) {
                    return u.authenticate('password');
                }).should.eventually.be.true;
            });
        });

        describe('given user provider is google', function () {
            beforeEach(function () {
                user.provider = 'google';
            });

            it('should succeed when saving without a password', function () {
                user.password = null;
                return user.save().should.be.fulfilled;
            });
        });

        describe('given user provider is facebook', function () {
            beforeEach(function () {
                user.provider = 'facebook';
            });

            it('should succeed when saving without a password', function () {
                user.password = null;
                return user.save().should.be.fulfilled;
            });
        });

        describe('given user provider is github', function () {
            beforeEach(function () {
                user.provider = 'github';
            });

            it('should succeed when saving without a password', function () {
                user.password = null;
                return user.save().should.be.fulfilled;
            });
        });
    });
});