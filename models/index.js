var shasum = require('shasum');
var util = require('util');
var _ = require('lodash');

var Link = require('./link');
var Task = require('./task');
var Hostvars = require('./hostvars');

var Benchs = {
  ns: 'benchs:%s',
  his: 'benchs_history:%s:%s',
};

Benchs.uuid = function uuid(doc) {
  var keyObj = {
    ip: doc.ip
  };
  return util.format(this.ns, shasum(keyObj));
};

Benchs.hisUuid = function hisUuid(doc) {
  var keyObj = {
    ip: doc.ip
  };
  var datetime = this.formatDateTime(new Date());
  return util.format(this.his, datetime, shasum(keyObj));
};

Benchs.formatDateTime = function formatDateTime(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  var hh = date.getHours();
  var mm = date.getMinutes();
  var ss = date.getSeconds();
  m = (m < 10 ? '0':'') + m;
  d = (d < 10 ? '0':'') + d;
  hh = (hh < 10 ? '0':'') + hh;
  mm = (mm < 10 ? '0':'') + mm;
  ss = (ss < 10 ? '0':'') + ss;
  return util.format('%s%s%s%s%s%s' , date.getFullYear(), m, d, hh, mm, ss);
};

module.exports = function(leveldb, etcd, zapi) {

  Link.leveldb = leveldb;
  Task.leveldb = leveldb;
  Hostvars.etcd = etcd;

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
    var self = this;
    leveldb.get(key, function(err, value) {
      self.del(key, function() {
        value = _.merge(value, data);
        leveldb.put(id, value, { valueEncoding: 'json' }, done);
      });
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
      .on('error', done)
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
