var express = require('express');
var router = express.Router();
const muserver = require('../exports/props');


/* GET /health */
router.get('/', function(req, res, next) {
	res.json(muserver.ping);
});

module.exports = router;