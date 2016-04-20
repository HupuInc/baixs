var EventEmitter = require('events').EventEmitter;
var net = require('net');
var request = require('request');
var shasum = require('shasum');
var url = require('url');
var util = require('util');

var NS = 'link:%s';
// default to 20 seconds
var TIMEOUT = 20 * 1000;
// default to run task every 1 minute
var INTERVAL = process.env.CHECK_INTERVAL * 1000 || 60 * 1000;

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

Link.create = function(doc, done) {
  var link = new Link(doc);
  link.save(done);
};

Link.fetch = function(key, done) {
  Link.leveldb.get(key, function(err, doc) {
    if (err) {
      done(err);
    }
    else {
      done(null, new Link(doc));
    }
  });
};

Link.fetchAll = function(done) {
  var stream = Link.leveldb.createReadStream({
    gte: 'link:0',
    lte: 'link:z',
  });

  if ('function' === typeof done) {
    var links = [];
    stream.on('data', function(aLink) {
      links.push(new Link(aLink.value));
    })
    .on('err', done)
    .on('close', function() {
      done(null, links);
    });
  }
  else {
    return stream;
  }
};

Link.prototype.toJSON = function() {
  return {
    key: this.id,
    value: this.doc,
  };
};

Link.prototype.save = function(done) {
  Link.leveldb.put(this.id, this.doc, { valueEncoding: 'json' }, done);
};

Link.prototype.del = function(done) {
  Link.leveldb.del(this.id, done);
};

Link.prototype.start = function() {
  setTimeout(this._execute.bind(this), INTERVAL);
};

Link.prototype._updateStats = function(timeSpent, statusCode) {
  this.doc.status = statusCode;
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

  var socket = net.connection(options, function() {
    socket.destroy();
  });

  scoket.on('close', function(hadError) {
    var code = 200;
    if (hadError) {
      code = 600;
    }

    done(hadError, code);
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
  var createdAt = (new Date()).valueOf();
  var urlObj = url.parse(this.doc.url);

  function requestEnd(err, code) {
    if (err) {
      self.doc.status = code;
    }
    else {
      var endAt = Date.now();
      var timeSpent = endAt - createdAt;
      self._updateStats(timeSpent, code);
    }

    self.emit('end', self);
  }

  if (urlObj.protocol === 'tcp') {
    tcpRequest(urlObj, requestEnd);
  }
  else {
    httpRequest(urlObj, this.doc.proxy, requestEnd);
  }
};

module.exports = Link;
