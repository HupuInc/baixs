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
      models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.data.ip), 'yes', bench.data.hostname, function(error) {
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
          models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.data.ip), 'no', value.hostname, function(error) {
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

  models.Event.fetchCurrentEvent(function(error, data) {
    if (error) {
      res.status(400).json(error);
    }
    else {
      res.json(data);
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
