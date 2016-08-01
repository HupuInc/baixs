var _ = require('lodash');
var moment = require('moment');

var Hostvars = {
  perfix: '/hostvars/',
  reg: /^\/hostvars\/(192.168.[2-9]\d.(\d+))/,
  regHost: /^\/hostvars\/(\d+.\d+.\d+.\d+)/,
  regJH: /\w+\.jh$|\w+\.jhyd$|\w+\.(?=jh.hupu.com)|^jh-|^jhyd-/,
  regKvm: /^kvm-vmm-/,
};

Hostvars.get = function(key, options, callback) {
  var self = this;
  if ('function' === typeof options) {
    callback = options;
    options = {};
  }
  this.etcd.get(key, options, function(err, body) {
    if (err) {
      self.etcdAli.get(key, options, callback);
    }
    else {
      callback(err, body);
    }
  });
};

Hostvars.set = function(key, value, hostname, options, callback) {
  if (hostname.match(this.regJH)) {
    this.etcd.set(key, value, options, callback);
  }
  else {
    this.etcdAli.set(key, value, options, callback);
  }
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
    var length = nodes.length;
    _.forEach(nodes, function(host) {
      var vmmHost = {};
      var domainKey = host.key + '/domain';
      var hostnameKey = host.key + '/hostname';
      var hostname = _.result(_.find(host.nodes, {'key': hostnameKey}), 'value');
      if (hostname && hostname.match(self.regKvm)) {
        var vmms = _.find(host.nodes, {'key': domainKey});
        vmmHost.domain = [];
        if (vmms) {
          vmmHost.domain = domains(vmms);
        }
        host.nodes.forEach(function(v) {
          var key = _.last(v.key.split('/'));
          if (key !== 'domain') {
            vmmHost[key] = v.value;
          }
        });
        vmmHost.ip = _.last(host.key.split('/'));
        vmmHost.count = vmmHost.domain ? vmmHost.domain.length : 0;
        Hostvars.leveldb.get(vmmHost.hostname, function(err, res) {
          vmmHost.metrics = res;
          vmmHosts.push(vmmHost);
          length --;
          if (length <= 0) {
            done(vmmHosts);
          }
        });
      }
      else {
        length --;
      }
    });
  }

  self.get(self.perfix, { recursive: true }, findVmmHost);
};

Hostvars.vmCounter = function(done) {
  var yesterday = moment(moment().subtract(1, 'days').toArray().slice(0, 3)).valueOf();
  var counterId = 'vmcounter:' + yesterday;

  Hostvars.fetchVmmHost(function(data) {
    var current = 0;
    data.forEach(function(v) {
      current += v.domain.length;
    });
    Hostvars.leveldb.put(counterId, current, done);
  });
};

Hostvars.stat = function(done) {
  var today = moment(moment().toArray().slice(0, 3)).valueOf();
  var lastWeek = moment(moment().toArray().slice(0, 3)).subtract(1, 'weeks').valueOf();
  Hostvars.fetchVmmHost(function(vmms) {
    var current = 0;
    var total = vmms.length * 6;
    vmms.forEach(function(v) {
      current += v.domain.length;
    });
    var condition = {
      gte: 'vmcounter:' + lastWeek,
      lte: 'vmcounter:' + today,
    };
    var stream = Hostvars.leveldb.createReadStream(condition);
    var stats = {
      total: total,
      current: current,
      stats: [
        {
          day: today,
          count: current,
        }],
    };
    stream.on('data', function(data) {
      var day = data.key.slice(data.key.indexOf(':') + 1);
      stats.stats.push({
        day: day,
        count: data.value,
      });
    })
    .on('error', done)
    .on('close', function() {
      stats.stats = _.sortBy(stats.stats, 'day');
      done(null, stats);
    });
  });
};

module.exports = Hostvars;
