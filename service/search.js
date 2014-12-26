'use strict';

var _ = require('lodash');
var cheerio = require('cheerio');
var debug = require('debug')('craigslist-search');
var q = require('q');
var request = q.nbind(require('request'));
var url = require('url');


var proto = {
  query: function (query, options) {
    function handleResponse(res) {
      var status = res[0].statusCode;

      if (status >= 400) {
        var err = new Error('Search query error: ' + status);
        err.status = status;
        return deferred.reject(err);
      }

      var $ = cheerio.load(res[1]);
      var result = $('.content .row').map(function () {
        return getRowData($(this));
      });

      deferred.resolve(result.get());
    }

    function handleError(err) {
      deferred.reject(err);
    }

    function getRowData($row) {
      var $anchor = $row.find('a.i');
      var $pl = $row.find('.txt .pl');

      return {
        pid: $row.attr('data-pid'),
        href: $anchor.attr('href'),
        img: $anchor.find('img').attr('src'),
        price: $anchor.find('.price').text(),
        text: $pl.find('.hdrlnk').text(),
        time: Date.parse($pl.find('time').attr('datetime'))
      };
    }

    this.setOptions(options);

    var url = this.getUrl(query);
    var deferred = q.defer();

    debug('Searching url %s', url);

    request(url)
    .then(handleResponse)
    .catch(handleError)
    .done();

    return deferred.promise;
  },

  getUrl: function (query) {
    query = query || '';
    
    var obj = {
      protocol: 'http',
      host: this.options.city + '.craigslist.org',
      pathname: 'search/sss',
      query: { query: query }
    };

    ['minAsk', 'maxAsk', 's', 'sort'].forEach(function (option) {
      /* jshint eqnull: true */
      var opt = this.options[option];
      if (opt != null) obj.query[option] = opt;
    }, this);

    return url.format(obj);
  },

  setOptions: function (options) {
    this.options = options || {};
    _.defaults(this.options, this.defaults);
  },

  defaults: {
    city: 'losangeles'
  }
};

module.exports = Object.create(proto);
