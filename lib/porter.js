var _ = require('lodash');
var models = require('../models');
var Host = models.Host;
var etcd = Host.etcd;

function parseIp(path) {
  return _.last(path.split('/'));
}

// extract out: hostname, has_problems, mac, parent from nodes
function parseAttrs(nodes) {
  return nodes.reduce(function(prev, node) {
    var key = _.last(node.key.split('/'));
    if (key !== 'domain') { // skip domain
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

function Porter() {}

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

module.exports = Porter;
