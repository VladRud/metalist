'use strict';

var _auth = require('../../auth/auth.service');

var auth = _interopRequireWildcard(_auth);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var express = require('express'),
    controller = require('./match.controller');


var router = express.Router();

router.get('/next', controller.getNextMatches);
router.get('/prev', controller.getPrevMatches);
router.get('/:id', controller.getMatchById);
router.post('/', auth.hasRole('admin'), controller.createMatch);
router.put('/:id', auth.hasRole('admin'), controller.updateMatch);
router.delete('/:id', auth.hasRole('admin'), controller.deleteMatch);

module.exports = router;