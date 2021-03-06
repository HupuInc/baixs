var util = require('util');
var EventEmitter = require('events').EventEmitter;
var zabbix = require('zabbix-node');
var zabbixConfig = require('../config').zabbix;
var zapi = new zabbix(zabbixConfig.url, zabbixConfig.user, zabbixConfig.password);

var INTERVAL = process.env.CHECK_INTERVAL * 1000 || 60 * 1000;

function Monitor() {
  EventEmitter.call(this);
  this.id = 'events';
  this.events = [];
}

util.inherits(Monitor, EventEmitter);

Monitor.prototype.start = function() {
  setTimeout(this._execute.bind(this), INTERVAL);
};

Monitor.prototype._execute = function() {
  var self = this;
  Monitor.fetchCurrentEvent(function(error, data) {
    self.emit('end', data);
  });
};

Monitor.fetchCurrentEvent = function(done) {
  var result = [];
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
      }, function(error, resp, body) {
        if (error) {
          done(error);
        }
        else {
          var count = body.length;
          if (count === 0) {
            done(null, []);
          }
          else {
            body.forEach(function(data) {
              var hostid = data.hosts[0].hostid;
              Monitor.getHostInterface(hostid, function(error, resp, body) {
                if (error) {
                  done(error);
                }
                else {
                  count--;
                  data.hosts[0].ip = body[0].ip;
                  result.push(data);
                  if (count <= 0) {
                    done(null, result);
                  }
                }
              });
            });
          }
        }
      });
    }
  });
};

Monitor.getHostInterface = function(hostid, done) {
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

module.exports = Monitor;
