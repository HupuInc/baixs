var request = require('request');
var shasum = require('shasum');
var util = require('util');
var _ = require('lodash');

var Link = {
  ns: 'link:%s'
};

Link.uuid = function uuid(doc) {
  var keyObj = {
    url: doc.url,
    proxy: doc.proxy || null
  };
  return util.format(this.ns, shasum(keyObj));
};

function Task(link) {
  var linkId = Link.uuid(link);
  this.createdAt = (new Date).valueOf();
  this.uuid = util.format(Task.ns, linkId, this.createdAt);
  this.link = link;
}

// The key of Task contains:
// - uuid value of link
// - creation timestamp (in milisecond) as the key
Task.ns = 'task:%s:%s';

// default to run task every 1 minute
Task.interval = 60 * 1000;

// default to 20 seconds
Task.timeout = 20 * 1000;

Task.sched = function(task, done) {
  setTimeout(function() {
    task.run(done);
  }, this.interval);
};

Task.prototype.sched = function(done) {
  Task.sched(this, done);
};

Task.prototype.run = function(done) {
  var self = this;
  request.get({
    url: this.link.url,
    proxy: this.link.proxy,
    followRedirect: false,
    timeout: Task.timeout
  }, function(err, resp, body) {
    if (err) {
      return done(err);
    }
    else {
      self.endAt = (new Date).valueOf();
      self.link.status = resp.statusCode
      self.link.lastTime = self.endAt;
      // last response time
      var lastResTime = self.endAt - self.createdAt;
      self.link.lastResTime = lastResTime;
      var count = self.link.count || 0;
      // average response time
      if (count > 0) {
        var avgResTime = self.link.avgResTime;
        self.link.avgResTime = Math.round(
          ((avgResTime * count) + lastResTime) / (count + 1)
        )
      }
      else {
        self.link.avgResTime =  lastResTime;
      }
      self.link.count = count + 1;
      Link.update(self.link,function() {
        self.save(done);
      });
    }
  });
};

var Hostvars = {
  perfix: '/hostvars/',
  reg: /^\/hostvars\/(192.168.20.(\d+))/,
};

Hostvars._argParser = function(options, callback) {
    if (typeof options === 'function') {
      return [{}, options];
    } else {
      return [options, callback];
    }
  };

module.exports = function(leveldb, etcd) {

  Link.fetchAll = function(done) {

    var stream = leveldb.createReadStream({
      gte: 'link:0',
      lte: 'link:z'
    });

    if ('function' === typeof done) {
      var links = [];
      stream.on('data', function(aLink) {
        links.push(aLink)
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

  Link.update = function(doc, done) {
    var id = this.uuid(doc);
    leveldb.put(id, doc, { valueEncoding: 'json' }, done);
  };

  Link.create = Link.update;

  Task.update = function(doc, done) {
    var uuid = doc.uuid;
     delete doc.uuid;
    leveldb.put(uuid, doc, { valueEncoding: 'json' }, done);
  };

  Task.prototype.save = function(done) {
    var doc = _.omit(this, _.isFunction);
    Task.update(doc, done);
  };

  Hostvars.get = function(key, options, callback) {
    var opt, ref;
    ref = this._argParser(options, callback), options = ref[0], callback = ref[1];
    etcd.get(key, options, callback);
  };

  Hostvars.fetchVmmHost = function(done) {
    var vmmHosts = [];
    function findVmmHost(error, body, resp) {
      var nodes = body.node.nodes;
      _.forEach(nodes, function(host) {
        var result = host.key.match(Hostvars.reg);
        if (result && result[2] <= 30)
          vmmHosts.push(host.key);
      });
      done(vmmHosts);
    }

    Hostvars.get(Hostvars.perfix, findVmmHost);
  };

  return {
    Link: Link,
    Task: Task,
    Hostvars: Hostvars,
  };
};
