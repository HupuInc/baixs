var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var models = require('../models');
var Host = models.Host;
var Link = models.Link;
var etcd = Host.etcd;

function parseIp(path) {
  return _.last(path.split('/'));
}

function parseLabels(nodes) {
  return nodes.map(function(node) {
    return _.last(node.key.split('/'));
  });
}

function parseMonitors(nodes) {
  return nodes.reduce(function(result, node) {
    var port = _.last(node.key.split('/'));
    result[port] = JSON.parse(node.value);
    return result;
  }, {});
}

// extract out: hostname, has_problems, mac, parent from nodes
function parseAttrs(nodes) {
  return nodes.reduce(function(prev, node) {
    var key = _.last(node.key.split('/'));

    if (key === 'labels') { // process labels
      prev.labels = node.nodes ? parseLabels(node.nodes) : [];
    }
    else if (key === 'monitor') {
      prev.monitor = node.nodes ? parseMonitors(node.nodes) : [];
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

// They way Porter works:
// - fetch all the hosts from etcd every 30 seconds
// - compose the Link one by one from each Host
// - store the hosts into leveldb
// - store the Link
// will emit
// - 'change' every time it finished synchronization with etcd
// - 'error' when error occurred
function Porter() {
  EventEmitter.call(this);
}

Porter.INTERVAL = 30 * 1000;

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

Porter.prototype.run = function run() {
  var self = this;
  self.fetchFromSource(function(err, hosts) {
    if (err) {
      return self.emit('error', err);
    }
    var batched = Host.leveldb.batch();
    var changes = [];
    hosts.forEach(function(host) {
      batched.put(host.id, host.doc);
      if (host.monitor) {
        changes = changes.concat(Link.parseFrom(host));
      }
    });

    batched.write(function(err) {
      setTimeout(run.bind(self), Porter.INTERVAL);

      if (err) {
        console.error(err.toString());
        self.emit('error', err);
      }
      else {
        if (changes) {
          self.emit('change', changes);
        }
      }
    });
  });
};

module.exports = Porter;
