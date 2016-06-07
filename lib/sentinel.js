var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Metric = require('../models').Metric;
var Hostvars = require('../models').Hostvars;

var Sentinel = function() {
  EventEmitter.call(this);
};

util.inherits(Sentinel, EventEmitter);

function requestEnded(metric) {
  var self = this;

  return function(buckets) {
    metric.metrics = {};
    buckets.forEach(function(bucket) {
      metric.metrics[bucket.key] = bucket.max_value.value;
    });
    metric.save(function() {
      self._execute(metric);
    });
  };
}

Sentinel.prototype._execute = function(metric) {
  metric.once('end', requestEnded.bind(this)(metric));
  metric.start();
};

Sentinel.prototype.start = function() {
  var self = this;
  Hostvars.fetchVmmHost(function(vmmHosts) {
    vmmHosts.forEach(function(vmmHost) {
      var metric = new Metric(vmmHost.hostname, {});
      self._execute(metric);
    });
  });
};

module.exports = Sentinel;
