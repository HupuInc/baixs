var shasum = require('shasum');
var util = require('util');
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config').zabbix;

// A Benchs object should contain - hostname / ip / markedAt,
//   when moved to history, it should contain - releaseAt
var BENCHS_NS = 'benchs:%s';
var BENCHS_HIS = 'benchs_history:%s:%s';
var zapi = new zabbix(zabbixConfig.url, zabbixConfig.user, zabbixConfig.password);

function Benchs(data) {
  this.data = data;
  this.id = Benchs.uuid(data);
}

Benchs.uuid = function(data) {
  return util.format(BENCHS_NS, shasum({ip: data.ip}));
};

Benchs.hisUuid = function(data) {
  var timestamp = parseInt(new Date().valueOf() / 1000);
  return util.format(BENCHS_HIS, timestamp, shasum({ip: data.ip}));
};

Benchs.prototype.save = function(done) {
  Benchs.leveldb.put(this.id, this.data, { valueEncoding: 'json' }, done);
};

Benchs.prototype.get = function(done) {
  Benchs.leveldb.get(this.id, done);
};

Benchs.prototype.del = function(done) {
  Benchs.leveldb.del(this.id, done);
};

Benchs.create = function(data, done) {
  var bench = new Benchs(data);
  bench.save(done);
};

Benchs.createHistory = function(data, done) {
  var bench = new Benchs(data);
  bench.id = Benchs.hisUuid(bench.data);
  bench.data.releaseAt = new Date().valueOf();
  console.log('history value:' + bench.data);
  bench.save(done);
};

Benchs.fetch = function(condition, done) {
  var stream = Benchs.leveldb.createReadStream(condition);

  if ('function' === typeof done) {
    var problems = [];
    stream.on('data', function(bench) {
      problems.push(new Benchs(bench.value));
    })
      .on('error', done)
      .on('close', function() {
        done(null, problems);
      });
  } else {
    return stream;
  }
};

Benchs.fetchCurrent = function(done) {
  var condition = {
    gte: 'benchs:0',
    lte: 'benchs:z',
  };
  this.fetch(condition, done);
};

Benchs.fetchHistory = function(start, end, done) {
  var condition = {
    gte: 'benchs_history:' + start + ':0',
    lte: 'benchs_history:' + end + ':z',
  };
  this.fetch(condition, done);
};

Benchs.fetchCurrentEvent = function(done) {
  zapi.login(function(err) {
    if (err) {
      done(err);
    }
    else {
      zapi.call('trigger.get', {
        'monitored': true,
        'filter': {
          'value': 1,
        },
        'skipDependent': true,
        'output': 'extend',
        'selectHosts': [
          'host',
          'hostid',
          'maintenance_status',
        ],
        'selectLastEvent': [
          'eventid',
          'acknowledged',
          'objectid',
          'clock',
          'ns',
        ],
        'expandDescription': true,
      }, done);
    }
  });
};

Benchs.getHostInterface = function(hostid, done) {
  zapi.login(function(err) {
    if (err) {
      done(err);
    }
    else {
      zapi.call('hostinterface.get', {
        'hostids': hostid,
      }, done);
    }
  });
};

module.exports = Benchs;
