var EventEmitter = require('events').EventEmitter;
var net = require('net');
var request = require('request');
var shasum = require('shasum');
var url = require('url');
var util = require('util');
var _ = require('lodash');

/**
Link.doc
  - url
  - proxy
  - lastResTime
  - avgResTime
  - count
**/

var NS = 'link:%s';
// default to 20 seconds
var TIMEOUT = 20 * 1000;
// default to run task every 1 minute
var INTERVAL = process.env.CHECK_INTERVAL * 1000 || 60 * 1000;

var LinksUnderMonitor = {};

function Link(doc) {
  EventEmitter.call(this);

  this.doc = doc;
  this.id = Link.uuid(doc);
}

util.inherits(Link, EventEmitter);

Link.uuid = function(doc) {
  var keyObj = {
    url: doc.url,
    proxy: doc.proxy || null,
  };
  return util.format(NS, shasum(keyObj));
};

Link.update = function(host) {
  Object.keys(host.monitor).forEach(function(port) {
    var monitorUrls = host.monitor[port];
    _.each(monitorUrls, function(href) {
      var urlObj = url.parse(href);
      var link;
      if (urlObj.protocol === 'tcp:') {
        link = new Link({
          url: href,
        });
      }
      else {
        link = new Link({
          proxy: urlObj.protocol + '//' + host.ip + ':' + port,
          url: href,
        });
      }
      LinksUnderMonitor[link.id] = link;
    });
  });
};

Link.fetch = function(key) {
  return LinksUnderMonitor[key];
};

Link.fetchAll = function() {
  return _.values(LinksUnderMonitor);
};

Link.clearAll = function() {
  LinksUnderMonitor = {};
};

Link.prototype.toJSON = function() {
  return {
    key: this.id,
    value: this.doc,
  };
};

Link.prototype.save = function() {
  LinksUnderMonitor[this.id] = this;
};

Link.prototype.del = function() {
  delete LinksUnderMonitor[this.id];
};

Link.prototype.start = function() {
  setTimeout(this._execute.bind(this), INTERVAL);
};

Link.prototype._updateStats = function(timeSpent) {
  this.doc.lastResTime = timeSpent;
  this.doc.count = this.doc.count || 0;

  // calculate average response time
  if (this.doc.count > 0) {
    var count = this.doc.count;
    var avgResTime = this.doc.avgResTime;
    this.doc.avgResTime = Math.round(
      ((avgResTime * count) + timeSpent) / (count + 1)
    );
  }
  else {
    this.doc.avgResTime = timeSpent;
  }

  this.doc.count ++;
};

function tcpRequest(urlObj, done) {
  var options = {
    host: urlObj.hostname,
    port: urlObj.port,
  };

  var socket = net.createConnection(options, function() {
    socket.destroy();
  });

  socket.setTimeout(2000);

  socket.on('timeout', function() {
    var code = 600;
    done(true, code);
  });

  socket.on('close', function(hadError) {
    var code = 200;
    if (!hadError) {
      done(hadError, code);
    }
  });

  socket.on('timeout', function() {
    var code = 599;
    done(true, code);
  });

  socket.on('error', function(err) {
    var code = 600;
    done(err, code);
  });
}

function httpRequest(urlObj, proxy, done) {
  request.get({
    url: urlObj.href,
    proxy: proxy,
    followRedirect: false,
    timeout: TIMEOUT,
    headers: {
      'Accept-Encoding': 'gzip, deflate',
    },
  }, function(err, resp) {
    var code = 600;

    if (err) {
      if (err.code === 'ETIMEDOUT') {
        code = 599;
      }
    }
    else {
      code = resp.statusCode;
    }

    done(err, code);
  });
}

Link.prototype._execute = function() {
  var self = this;
  var createdAt = Date.now();
  var urlObj = url.parse(this.doc.url);

  function requestEnd(err, code) {
    self.doc.status = code;

    if (!err) {
      var endAt = Date.now();
      var timeSpent = endAt - createdAt;
      self._updateStats(timeSpent);
    }

    self.emit('end', self);
  }

  if (urlObj.protocol === 'tcp:') {
    tcpRequest(urlObj, requestEnd);
  }
  else {
    httpRequest(urlObj, this.doc.proxy, requestEnd);
  }
};

module.exports = Link;
