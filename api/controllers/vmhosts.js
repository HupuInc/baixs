var _ = require('lodash');

function fetchVmmHost(req, res, done) {
  var Hostvars = req.app.get('models').Hostvars;
  Hostvars.fetchVmmHost(done);
}

exports.getVmHosts = function getVmHosts(req, res) {
  function sender(data) {
    res.type('json').send(JSON.stringify(data));
  }

  fetchVmmHost(req, res, function(data) {
    sender(_.sortBy(data, 'hostname'));
  });
};

exports.search = function search(req, res) {
  var q = req.swagger.params.q.value,
    re = new RegExp(q),
    keys = ['hostname', 'ip', 'domain'];

  function sender(data) {
    res.type('json').send(JSON.stringify(data));
  }

  function matchesValue(obj) {
    var result = false;
    keys.forEach(function(key) {
      var value = _.get(obj, key);

      if (value && 'string' === typeof value && value.match(re)) {
        result = true;
      }
    });
    return result;
  }

  function filter(data) {
    var searchResult = [];
    data = _.sortBy(data, 'hostname');
    data.forEach(function(host) {
      var domains = _.filter(host.domain, function(guest) {
        return matchesValue(guest);
      });
      if (0 === _.size(domains) && matchesValue(host)) {
        host.domain = [];
        searchResult.push(host);
      }
      else if (0 !== _.size(domains)) {
        host.domain = domains;
        searchResult.push(host);
      }
    });
    sender(searchResult);
  }

  fetchVmmHost(req, res, filter);
};

exports.counter = function counter(req, res) {
  var Hostvars = req.app.get('models').Hostvars;
  Hostvars.vmCounter(function(err) {
    res.status(201).send('success');
  });
};
