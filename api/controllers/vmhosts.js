var _ = require('lodash');
var util = require('util');

exports.getVmHosts = function getVmHosts(req, res) {
  var Hostvars = req.app.get('models').Hostvars,
    vmmHosts = [],
    reg = /^\/hostvars\/(192.168.20.\d+)\/(.+)/,
    count = 0;

  function sender() {
    res.type('json').send(JSON.stringify(vmmHosts));
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
      result = value.key.match(reg);
      vmmHost.ip = result[1];
      if (result[2] === 'domain') {
        vmmHost.domain = [];
        value.nodes.forEach(function(host) {
          vmmHost.domain.push(guests(host));
        });
      }
      else
        vmmHost[result[2]] = value.value;
    });
    count--;
    vmmHosts.push(vmmHost);
    if (count <= 0)
      sender();
  }

  Hostvars.fetchVmmHost(function(hosts) {
    count = hosts.length;
    hosts.forEach(function(host) {
      Hostvars.get(host, { recursive: true }, domains);
    });

  });
};