'use strict';

var express = require('express');
var search = require('craigslist-json-search');

var router = express.Router();

router.get('/', function (req, res) {
  res.send('Search front end goes here...');
});

router.get('/s/:query', function(req, res, next) {
  search
  .query(req.params.query)
  .then(function (result) {
    return res.send(JSON.stringify(result));
  })
  .catch(function (err) {
    next(err);
  })
  .done();
});

module.exports = router;
