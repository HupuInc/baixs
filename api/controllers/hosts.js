var _ = require('lodash');
var DEFINED_KEYS = ['hostname', 'app_group'];

function isNumber(str) {
  return /^\d+$/.test(str);
}

function groupsFromPredefined(host) {
  return DEFINED_KEYS.map(function(key) {
    return host[key];
  });
}

function groupsFromLabel(host) {
  if (host.labels && host.labels.length > 0) {
    return host.labels;
  }
  else {
    return [];
  }
}

function groupsFromName(host) {
  return host.hostname
    .replace('.hupu.com', '')
    .replace(/-/g, '.')
    .split('.');
}

exports.list = function(req, res) {
  var groupedHosts = {};

  function addToGroup(name, host) {
    var ip = host.ip;
    if (!groupedHosts[name]) {
      groupedHosts[name] = { hosts: [ ip ] };
    }
    else {
      if (groupedHosts[name].hosts.indexOf(ip) === -1) {
        groupedHosts[name].hosts.push(ip);
      }
    }
  }

  function groupsFrom(host) {
    var groupNames = [].concat(
      groupsFromPredefined(host),
      groupsFromLabel(host),
      groupsFromName(host)
    );

    _.filter(groupNames).forEach(function(name) {
      if (!isNumber(name)) {
        addToGroup(name, host);
      }
    });
  }

  var Host = req.app.get('models').Host;
  Host.fetchAll(function(err, hosts) {
    if (err) {
      throw err;
    }

    // compose all the groups
    hosts.forEach(function(host) {
      groupsFrom(host);
    });

    // compose _meta.hostvars
    groupedHosts['_meta'] = {
      hostvars: hosts.reduce(function(prev, host) {
        prev[host.ip] = { hostname: host.hostname };
        return prev;
      }, {}),
    };

    res.json(groupedHosts);
  });
};

exports.deleteHost = function(req, res) {
  var data = req.body;
  var models = req.app.get('models');
  console.log(data);
  models.Monitor.disableHost(data.hostname, function(err) {
    if (err) {
      console.log(err);
      return res.status(400).json({ message: err.toString() });
    }
    return res.json({message: 'success'});
  });
};

exports.modifyHostname = function(req, res) {
  var data = req.body;
  var models = req.app.get('models');
  models.Monitor.modifyHostname(data.oldHostname, data.newHostname, function(err) {
    if (err) {
      console.log(err);
      return res.status(400).json({ message: err.toString() });
    }
    return res.json({message: 'success'});
  });
};
