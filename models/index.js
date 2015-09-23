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
  this.createdAt = (new Date()).valueOf();
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

Task.prototype._updateStats = function(ifSuccess, timeSpent, statusCode) {
  if (ifSuccess) {
    this.link.status = statusCode;
    this.link.lastResTime = timeSpent;
    this.link.count = this.link.count || 0;

    // calculate average response time
    if (this.link.count > 0) {
      var avgResTime = this.link.avgResTime;
      this.link.avgResTime = Math.round(
        ((avgResTime * count) + timeSpent) / (count + 1)
      );
    }
    else {
      this.link.avgResTime = timeSpent;
    }

    this.link.count ++;
  }
  else {
    this.link.status = null;
  }
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
    self.endAt = (new Date()).valueOf();
    var timeSpent = self.endAt - self.createdAt;
    var ifSuccess = true;

    if (err) {
      ifSuccess = false;
    }

    self._updateStats(ifSuccess, timeSpent, resp && resp.statusCode);
    Link.update(self.link, function() {
      self.save(done);
    });
  });
};

var Hostvars = {
  perfix: '/hostvars/',
  reg: /^\/hostvars\/(192.168.[2-9]\d.(\d+))/,
  regDomain: /^\/hostvars\/(192.168.[2-9]\d.\d+)\/(.+)/,
  regHost: /^\/hostvars\/(\d+.\d+.\d+.\d+)/,
};

Hostvars._argParser = function(options, callback) {
  if (typeof options === 'function') {
    return [{}, options];
  } else {
    return [options, callback];
  }
};

var Benchs = {
  ns: 'benchs:%s',
  his: 'benchs_history:%s',
};

Benchs.uuid = function uuid(doc) {
  var keyObj = {
    hostname: doc.hostname,
    ip: doc.ip
  };
  return util.format(this.ns, shasum(keyObj));
};

Benchs.hisUuid = function uuid(doc) {
  var keyObj = {
    hostname: doc.hostname,
    ip: doc.ip
  };
  return util.format(this.his, shasum(keyObj));
};

module.exports = function(leveldb, etcd, zapi) {

  Link.fetchAll = function(done) {

    var stream = leveldb.createReadStream({
      gte: 'link:0',
      lte: 'link:z'
    });

    if ('function' === typeof done) {
      var links = [];
      stream.on('data', function(aLink) {
        links.push(aLink);
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
    leveldb.del(id, done);
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

  Hostvars.set = function(key, value, options, callback) {
    var opt, ref;
    ref = this._argParser(options, callback), options = ref[0], callback = ref[1];
    etcd.set(key, value, options, callback);
  };

  Hostvars.fetchVmmHost = function(done) {
    var vmmHosts = [],
      vmHosts = [],
      count = 0,
      self = this;

    function fetchGuestHostname() {
      var count = 0;

      vmHosts.forEach(function(host) {
        if (host.domain) {
          count += host.domain.length;
          host.domain.forEach(function(guest) {
            var key = util.format(self.perfix + '%s/hostname', guest.ip);
            self.get(key, function(error, body, resp) {
              if (!error) {
                guest.hostname = body.node.value;
              }
              count--;
              if (count <= 0) {
                done(vmHosts);
              }
            });
          });
        }
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
        result = value.key.match(self.regDomain);
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
        var result = host.key.match(self.reg);
        if (result && result[2] <= 30) {
          vmmHosts.push(host.key);
        }
      });
      count = vmmHosts.length;
      vmmHosts.forEach(function(host) {
        self.get(host, { recursive: true }, domains);
      });
    }

    self.get(self.perfix, findVmmHost);
  };

  Hostvars.fetchHasProblems = function(done) {
    var self = this;
    function findHasProblems(error, body, resp) {
      var nodes = body.node.nodes,
        hosts = [];
      _.forEach(nodes, function(host) {
        var props = host.nodes;
        var key = host.key;
        if (_.find(props, {'key': key + '/has_problems', 'value': 'yes' })) {
          hosts.push({
            hostname: _.result(_.find(props, { 'key': key + '/hostname' }), 'value'),
            ip: key.match(self.regHost)[1],
          });
        }
      });
      done(hosts);
    }
    self.get(self.perfix, { recursive: true}, findHasProblems);
  };

  Benchs.create = function(data, done) {
    var id = this.uuid(data);
    leveldb.put(id, data, { valueEncoding: 'json'}, done);
  };

  Benchs.del = function(id, done) {
    leveldb.del(id, done);
  };

  Benchs.move2history = function(data, done) {
    var id = this.hisUuid(data);
    var key = this.uuid(data);
    this.del(key, function() {
      leveldb.put(id, data, { valueEncoding: 'json' }, done);
    });
  };

  Benchs.fetchCurrentAll = function(done) {
    var stream = leveldb.createReadStream({
      gte: 'benchs:0',
      lte: 'benchs:z'
    });

    if ('function' === typeof done) {
      var problems = [];
      stream.on('data', function(host) {
        problems.push(host);
      })
      .on('err', done)
      .on('close', function() {
        done(null, problems);
      });
    }
    else {
      return stream;
    }
  };

  Benchs.fetchCurrentEvent = function(done) {
    zapi.call('trigger.get', {
      'monitored': true,
      'filter': {'value': 1},
      'skipDependent': true,
      'output': 'extend',
      'selectHosts': [
        'host',
        'hostid',
        'maintenance_status',
      ],
      'selectLastEvent':[
        'eventid',
        'acknowledged',
        'objectid',
        'clock',
        'ns',
      ],
      'expandDescription':
      true
    }, done);
  };

  Benchs.getHostInterface = function(hostid, done) {
    zapi.call('hostinterface.get', {
      'hostids': hostid
    }, done);
  };

  return {
    Link: Link,
    Task: Task,
    Hostvars: Hostvars,
    Benchs: Benchs,
  };
};
