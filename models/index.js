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
  reg: /^\/hostvars\/(192.168.[2-9]\d.(\d+))/,
  regDomain: /^\/hostvars\/(192.168.[2-9]\d.\d+)\/(.+)/,
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

  Link.del = function(id, done) {
    leveldb.del(id, done)
  };

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
    var vmmHosts = [],
      vmHosts = [],
      count = 0,
      that = this;

    function fetchGuestHostname() {
      var count = 0;

      vmHosts.forEach(function(host) {
        count += host.domain.length;
        host.domain.forEach(function(guest) {
          var key = util.format(that.perfix + '%s/hostname', guest.ip);
          that.get(key, function(error, body, resp) {
            if (!error) {
              guest.hostname = body.node.value;
            }
            count--;
            if (count <= 0) {
              done(vmHosts);
            }
          });
        });
      });
    }

    function guests(host) {
      var guest = {};

      host.nodes.forEach(function(vm) {
        key = _.last(vm.key.split('/'));
        guest[key] = vm.value;
      });
      guest.domain = _.last(host.key.split('/'));
      return guest;
    }

    function domains(error, body, resp) {
      var vmmHost = {},
        result = null;
      var nodes = body.node.nodes;
      _.forEach(nodes, function(value) {
        result = value.key.match(that.regDomain);
        vmmHost.ip = result[1];
        if (result[2] === 'domain') {
          vmmHost.domain = [];
          if (value.nodes) {
            value.nodes.forEach(function(host) {
              vmmHost.domain.push(guests(host));
            });
          }
        }
        else {
          vmmHost[result[2]] = value.value;
        }
      });
      count--;
      vmHosts.push(vmmHost);
      if (count <= 0) {
        fetchGuestHostname();
      }
    }

    function findVmmHost(error, body, resp) {
      var nodes = body.node.nodes;
      _.forEach(nodes, function(host) {
        var result = host.key.match(that.reg);
        if (result && result[2] <= 30)
          vmmHosts.push(host.key);
      });
      count = vmmHosts.length;
      vmmHosts.forEach(function(host) {
        that.get(host, { recursive: true }, domains);
      });
    }

    that.get(that.perfix, findVmmHost);
  };

  return {
    Link: Link,
    Task: Task,
    Hostvars: Hostvars,
  };
};
