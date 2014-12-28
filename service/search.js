'use strict';

var _ = require('lodash');
var cheerio = require('cheerio');
var debug = require('debug')('craigslist-search');
var q = require('q');
var request = q.nbind(require('request'));
var url = require('url');

module.exports = Object.create({
  
  defaults: {
    city: 'losangeles',
    supportedQueryOptions: ['minAsk', 'maxAsk', 's', 'sort']
  },

  query: function (query, options) {
    function handleSuccess(res) {
      var status = res[0].statusCode;

      if (status >= 400) {
        var err = new Error('Search query error: ' + status);
        err.status = status;
        return deferred.reject(err);
      }

      var body = res[1];

      debug('Got %d response:\n%s', status, body);

      var $ = cheerio.load(body);
      var result = $('.content .row').map(function () {
        return getPostData($(this));
      });

      deferred.resolve(result.get());
    }

    function handleError(err) {
      debug('Search query failed: %s', err);
      deferred.reject(err);
    }

    function getPostData($row) {
      var baesUrl = 'http://' + host;
      var $anchor = $row.find('a.i');
      var $pl = $row.find('.txt .pl');
      var $cat = $row.find('.l2 .gc');

      return {
        pid: $row.attr('data-pid'),
        href: baesUrl + $anchor.attr('href'),
        price: $anchor.find('.price').text(),
        text: $pl.find('.hdrlnk').text(),
        time: Date.parse($pl.find('time').attr('datetime')),
        category: {
          href: baesUrl + $cat.attr('href'),
          id: $cat.attr('data-cat'),
          text: $cat.text()
        }
      };
    }

    this.setOptions(options);

    var host = this.getHost();
    var searchQryUrl = this.getSearchQueryUrl(host, query);
    var deferred = q.defer();

    debug('Search query url: %s', searchQryUrl);

    request(searchQryUrl)
    .then(handleSuccess)
    .catch(handleError)
    .done();

    return deferred.promise;
  },

  getHost: function () {
    return this.options.city + '.craigslist.org';
  },

  getSearchQueryUrl: function (host, query) {
    query = query || '';
    
    var obj = {
      protocol: 'http',
      host: host,
      pathname: 'search/sss',
      query: { query: query }
    };

    this.options.supportedQueryOptions.forEach(function (option) {
      var opt = this.options[option];

      /* jshint eqnull: true */
      if (opt != null) { obj.query[option] = opt; }
    }, this);

    return url.format(obj);
  },

  setOptions: function (options) {
    this.options = options || {};
    _.defaults(this.options, this.defaults);
  }
});
