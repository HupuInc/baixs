var _ = require('lodash');
var util = require('util');

function fetchCurrent(Benchs, done) {
  Benchs.fetchCurrent(done);
}

exports.benchs = function benchs(req, res) {
  var Benchs = req.app.get('models').Benchs;
  fetchCurrent(Benchs, function(error, data) {
    res.json(data);
  });
};

exports.create = function create(req, res) {
  var models = req.app.get('models');
  var perfix = models.Hostvars.perfix;
  var data = req.body;
  console.log('put into bench:' + data);

  function errorRes(err) {
    res.status(400).json({ message: err.toString() });
  }

  function saveBenchs(bench) {
    bench.save(function() {
      models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.data.ip), 'yes', function(error) {
        if (error) {
          return errorRes(error);
        }
        fetchCurrent(models.Benchs, function(err, data) {
          return res.status(201).json(data);
        });
      });
    });
  }

  models.Hostvars.get(util.format(perfix + '%s/hostname', data.ip), function(error, body) {
    if (error) {
      return errorRes(error);
    }
    data.hostname = body.node.value;
    data.markedAt = new Date().valueOf();
    var bench = new models.Benchs(data);
    bench.get(function(err, value) {
      if (err) {
        saveBenchs(bench);
      }
      else {
        models.Benchs.createHistory(value, function() {
          saveBenchs(bench);
        });
      }
    });
  });
};

exports.del = function del(req, res) {
  var models = req.app.get('models');
  var perfix = models.Hostvars.perfix;
  var body = req.body;
  var count = body.length;

  function errorRes(err) {
    res.status(400).json({ message: err.toString() });
  }

  console.log('delete benches:' + body);
  _.forEach(body, function(data) {
    var bench = new models.Benchs(data);
    bench.get(function(err, value) {
      if (err) {
        return errorRes(err);
      }
      models.Benchs.createHistory(value, function() {
        bench.del(function() {
          models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.data.ip), 'no', function(error) {
            if (error) {
              return errorRes(error);
            }
            count--;
            if (count === 0) {
              fetchCurrent(models.Benchs, function(err, data) {
                return res.json(data);
              });
            }
          });
        });
      });
    });
  });
};

exports.events = function events(req, res) {
  var models = req.app.get('models');
  var result = [];

  models.Benchs.fetchCurrentEvent(function(error, resp, body) {
    if (error) {
      return res.status(400).json(error);
    }
    else {
      var count = body.length;
      if (count === 0) {
        return res.json(result);
      }
      _.forEach(body, function(data) {
        var hostid = data.hosts[0].hostid;
        models.Benchs.getHostInterface(hostid, function(error, resp, body) {
          if (error) {
            return res.status(400).json(error);
          }
          count--;
          if (!error) {
            data.hosts[0].ip = body[0].ip;
          }
          result.push(data);
          if (count <= 0) {
            return res.json(result);
          }
        });
      });
    }
  });
};

exports.history = function history(req, res) {
  var start = req.query.start;
  var end = req.query.end;

  var Benchs = req.app.get('models').Benchs;
  Benchs.fetchHistory(start, end, function(error, data) {
    if (error) {
      return res.status(400).json(error);
    }
    res.json(data);
  });
};
