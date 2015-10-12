var shasum = require('shasum');
var util = require('util');
var _ = require('lodash');

var Link = require('./link');
var Task = require('./task');

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
  his: 'benchs_history:%s:%s',
};

Benchs.uuid = function uuid(doc) {
  var keyObj = {
    hostname: doc.hostname,
    ip: doc.ip
  };
  return util.format(this.ns, shasum(keyObj));
};

Benchs.hisUuid = function hisUuid(doc) {
  var keyObj = {
    hostname: doc.hostname,
    ip: doc.ip
  };
  var date = this.formatDate(new Date());
  return util.format(this.his, date, shasum(keyObj));
};

Benchs.formatDate = function formatDate(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  return util.format('%s%s%s' , date.getFullYear(), (m < 10 ? '0':'') + m, (d < 10 ? '0':'') + d);
};

module.exports = function(leveldb, etcd, zapi) {

  Link.leveldb = leveldb;
  Task.leveldb = leveldb;

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

  Benchs.fetchHistory = function(start, end, done) {
    var stream = leveldb.createReadStream({
      gte: 'benchs_history:' + start + ':0',
      lte: 'benchs_history:' + end + ':z',
    });

    if ('function' === typeof done) {
      var historys = [];
      stream.on('data', function(host) {
        historys.push(host);
      })
      .on('err', done)
      .on('close', function() {
        done(null, historys);
      });
    }
    else {
      return stream;
    }
  };

  return {
    Link: Link,
    Task: Task,
    Hostvars: Hostvars,
    Benchs: Benchs,
  };
};
