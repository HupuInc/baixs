var _ = require('lodash');

var Hostvars = {
  perfix: '/hostvars/',
  reg: /^\/hostvars\/(192.168.[2-9]\d.(\d+))/,
  regHost: /^\/hostvars\/(\d+.\d+.\d+.\d+)/,
};

Hostvars.get = function(key, options, callback) {
  this.etcd.get(key, options, callback);
};

Hostvars.set = function(key, value, options, callback) {
  this.etcd.set(key, value, options, callback);
};

Hostvars.fetchVmmHost = function(done) {
  var vmmHosts = [];
  var self = this;
  var nodes = null;

  function domains(vmm) {
    var guests = [];
    _.forEach(vmm.nodes, function(node) {
      var guest = {};
      _.forEach(node.nodes, function(vm) {
        var key = _.last(vm.key.split('/'));
        guest[key] = vm.value;
      });
      guest.domain = _.last(node.key.split('/'));
      guest.hostname = _.result(_.find(_.result(_.find(nodes, {'key': self.perfix + guest.ip}), 'nodes'), {'key': self.perfix + guest.ip + '/hostname'}), 'value');
      guests.push(guest);
    });
    return guests;
  }

  function findVmmHost(error, body) {
    if (error || !body) {
      return done(vmmHosts);
    }
    nodes = body.node.nodes;
    _.forEach(nodes, function(host) {
      var vmmHost = {};
      var domainKey = host.key + '/domain';
      var vmms = _.find(host.nodes, {'key': domainKey});
      var result = host.key.match(self.reg);
      if (vmms && result) {
        vmmHost.domain = domains(vmms);
        host.nodes.forEach(function(v) {
          var key = _.last(v.key.split('/'));
          if (key !== 'domain') {
            vmmHost[key] = v.value;
          }
        });
        vmmHost.ip = _.last(host.key.split('/'));
        vmmHosts.push(vmmHost);
      }
    });
    done(vmmHosts);
  }

  self.get(self.perfix, { recursive: true }, findVmmHost);
};

Hostvars.fetchHasProblems = function(done) {
  var self = this;
  function findHasProblems(error, body) {
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
  self.get(self.perfix, { recursive: true }, findHasProblems);
};

module.exports = Hostvars;
