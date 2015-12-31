var _ = require('lodash');

function fetchVmmHost(req, res, location, done) {
  var Hostvars = req.app.get('models').Hostvars;
  Hostvars.fetchVmmHost(location, done);
}

exports.getVmHosts = function getVmHosts(req, res) {
  function sender(data) {
    res.type('json').send(JSON.stringify(data));
  }
  var location = 'all';
  if (req.swagger.params.location) {
    location = req.swagger.params.location.value;
  }

  fetchVmmHost(req, res, location, function(data) {
    sender(_.sortBy(data, 'count'));
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
    data = _.sortBy(data, 'count');
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

  fetchVmmHost(req, res, 'all', filter);
};

exports.counter = function counter(req, res) {
  var Hostvars = req.app.get('models').Hostvars;
  Hostvars.vmCounter(function(err) {
    if (err) {
      res.status(400).json({
        message: err.toString(),
      });
    }
    else {
      res.status(201).send('success');
    }
  });
};

exports.stat = function stat(req, res) {
  var Hostvars = req.app.get('models').Hostvars;
  Hostvars.stat(function(err, data) {
    if (err) {
      res.status(400).json({
        message: err.toString(),
      });
    }
    else {
      res.json(data);
    }
  });
};
