var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var models = require('../models');
var Host = models.Host;
var etcd = Host.etcd;

function parseIp(path) {
  return _.last(path.split('/'));
}

function parseLabels(nodes) {
  return nodes.map(function(node) {
    return _.last(node.key.split('/'));
  });
}

// extract out: hostname, has_problems, mac, parent from nodes
function parseAttrs(nodes) {
  return nodes.reduce(function(prev, node) {
    var key = _.last(node.key.split('/'));

    if (key === 'labels') { // process labels
      prev.labels = node.nodes ? parseLabels(node.nodes) : [];
    }
    else if (key === 'domain') { // skip domain
    }
    else {
      prev[key] = node.value;
    }
    return prev;
  }, {});
}

function parse(nodes) {
  return nodes.map(function(node) {
    var doc =  _.assign(
      { ip: parseIp(node.key) },
      Host.dummy,
      parseAttrs(node.nodes)
    );
    return new Host(doc);
  });
}

// will emit
// - 'change' event every time it synchronizes with etcd
// - 'error' event when error occurred
function Porter() {
  EventEmitter.call(this);
}

util.inherits(Porter, EventEmitter);

Porter.prototype.fetchFromSource = function(done) {
  var PREFIX = '/hostvars/';
  etcd.get(PREFIX, { recursive: true }, function(err, body) {
    if (err) {
      done(err);
    }
    else {
      var hosts = parse(body.node.nodes);
      done(null, hosts);
    }
  });
};

function run() {
  var self = this;
  self.fetchFromSource(function(err, hosts) {
    if (err) {
      return self.emit('error', err);
    }

    var batched = Host.leveldb.batch();
    hosts.forEach(function(host) {
      batched.put(host.id, host.doc);
    });
    batched.write(function(err) {
      if (err) {
        console.error(err.toString());
        self.emit('error', err);
      }
      else {
        process.nextTick(function() {
          self.emit('change');
        });
      }

      self.start();
    });
  });
}

Porter.INTERVAL = 30 * 1000;

Porter.prototype.start = function() {
  setTimeout(run.bind(this), Porter.INTERVAL);
};

module.exports = Porter;
