var util = require('util');
var EventEmitter = require('events').EventEmitter;
var elastic = require('elasticsearch');
var elasticConfig = require('../config').elastic;
var client = new elastic.Client(elasticConfig);

var INTERVAL = 86400 * 1000;

function buildQueryBody(from, to, host) {
  return {
    "size": 0,
    "query": {
      "filtered": {
        "query": {
          "query_string": {
            "query": "host:\"" + host + "\" AND (\"system.cpu.load\\[percpu,avg1\\]\" OR \"vmm.disk.check\" OR \"vm.memory.size\\[total\\]\" OR \"system.cpu.num\")",
            "analyze_wildcard": true
          }
        },
        "filter": {
          "bool": {
            "must": [
              {
                "range": {
                  "time": {
                    "gte": from,
                    "lte": to,
                    "format": "epoch_millis"
                  }
                }
              }
            ],
            "must_not": []
          }
        }
      }
    },
    "aggs": {
      "metrics_terms": {
        "terms": {
          "field": "metrics",
          "size": 10,
          "order": {
            "max_value": "desc"
          }
        },
        "aggs": {
          "max_value": {
            "max": {
              "field": "value"
            }
          }
        }
      }
    }
  };
}

var Metric = function(host, metrics) {
  EventEmitter.call(this);

  this.host = host;
  this.metrics = metrics;
  this.first = false;
};

util.inherits(Metric, EventEmitter);

Metric.prototype.save = function(done) {
  Metric.leveldb.put(this.host, this.metrics, done);
};

Metric.get = function(host, done) {
  Metric.leveldb.get(host, done);
};

function requestMetrics(host, done) {
  var to = new Date().valueOf();
  var from = to - INTERVAL;
  client.search({
    index: 'zabbixmetrics-*',
    body: buildQueryBody(from, to, host),
    timeout: '1m'
  }, done);
}

Metric.prototype.start = function() {
  if (!this.first) {
    this.query();
    this.first = true;
  }
  else {
    setTimeout(this.query.bind(this), INTERVAL);
  }
};

Metric.prototype.query = function() {
  var self = this;
  requestMetrics(this.host, function(err, resp) {
    if (err) {
      console.log(err);
      return;
    }
    self.emit('end', resp.aggregations.metrics_terms.buckets);
  });
};

module.exports = Metric;
