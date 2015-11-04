var EventEmitter = require('events').EventEmitter;
var request = require('request');
var shasum = require('shasum');
var util = require('util');

var NS = 'link:%s';
// default to 20 seconds
var TIMEOUT = 20 * 1000;
// default to run task every 1 minute
var INTERVAL = process.env.CHECK_INTERVAL * 1000 || 60 * 1000;

function Link(doc) {
  EventEmitter.call(this);

  this.doc = doc
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

Link.prototype._execute = function() {
  var self = this;
  var createdAt = (new Date()).valueOf();
  request.get({
    url: this.doc.url,
    proxy: this.doc.proxy,
    followRedirect: false,
    timeout: TIMEOUT,
  }, function(err, resp) {
    var endAt = (new Date()).valueOf();
    var timeSpent = endAt - createdAt;

    if (err) {
      self.doc.status = 600;
      if (err.code === 'ETIMEDOUT') {
        self.doc.status = 599;
      }
    }
    else {
      self._updateStats(timeSpent, resp && resp.statusCode);
    }

    self.emit('end', self);
  });
};

module.exports = Link;
