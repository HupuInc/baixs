var _ = require('lodash');
var util = require('util');

function fetchCurrentAll(req, res, done) {
  var Benchs = req.app.get('models').Benchs;
  Benchs.fetchCurrentAll(done);
}

exports.benchs = function benchs(req, res) {
  function sender(error, data) {
    res.type('json').send(JSON.stringify(data));
  }

  fetchCurrentAll(req, res, sender);
};

exports.create = function create(req, res) {
  var models = req.app.get('models'),
    perfix = models.Hostvars.perfix,
    data = req.body;

  function errorRes(err) {
    res.status(400).json({
      message: err.toString()
    });
  }

  models.Hostvars.get(util.format(perfix + '%s/hostname', data.ip), function(error, body, resp) {
    if (error) {
      errorRes(error);
    }
    var hostname = body.node.value;
    data.hostname = hostname;
    data.markedAt = (new Date()).valueOf();
    models.Benchs.create(data, function(err) {
      if (err) {
        errorRes(err);
      }
      models.Hostvars.set(util.format(perfix + '%s/has_problems', data.ip), 'yes', function(error, body, resp) {
        if (error) {
          errorRes(error);
        }
        models.Benchs.fetchCurrentAll(function(err, benchs) {
          if (err) {
            errorRes(err);
          }
          res.status(201).json(benchs);
        });
      });
    });
  });
};

exports.del = function del(req, res) {
  var models = req.app.get('models'),
    perfix = models.Hostvars.perfix,
    data = req.body;
    count = data.length;

  function errorRes(err) {
    res.status(400).json({
      message: err.toString()
    });
  }
  console.log(data);
  _.forEach(data, function(bench) {
    bench.releaseAt = (new Date()).valueOf();
    models.Benchs.move2history(bench, function(err) {
      if (err) {
        errorRes(err);
      }
      models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.ip), 'no', function(error, body, resp) {
        if (error) {
          errorRes(error);
        }
        count--;
        if (count === 0) {
          models.Benchs.fetchCurrentAll(function(err, benchs) {
            if (err) {
              errorRes(err);
            }
            res.status(201).json(benchs);
          });
        }
      });
    });
  });
};