var util = require('util');
var _ = require('lodash');

var Hostvars = {
  perfix: '/hostvars/',
  reg: /^\/hostvars\/(192.168.[2-9]\d.(\d+))/,
  regDomain: /^\/hostvars\/(192.168.[2-9]\d.\d+)\/(.+)/,
  regHost: /^\/hostvars\/(\d+.\d+.\d+.\d+)/,
};

Hostvars.get = function(key, options, callback) {
  this.etcd.get(key, options, callback);
};

Hostvars.set = function(key, value, options, callback) {
  this.etcd.set(key, value, options, callback);
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

module.exports = Hostvars;
