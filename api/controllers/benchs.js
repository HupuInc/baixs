var _ = require('lodash');
var util = require('util');

function fetchCurrentAll(Benchs, done) {
  Benchs.fetchCurrentAll(done);
}

exports.benchs = function benchs(req, res) {
  var Benchs = req.app.get('models').Benchs;
  fetchCurrentAll(Benchs, function(error, data) {
    res.json(data);
  });
};

exports.create = function create(req, res) {
  var models = req.app.get('models');
  var perfix = models.Hostvars.perfix;
  var data = req.body;

  function errorRes(err) {
    res.status(400).json({
      message: err.toString()
    });
  }

  models.Hostvars.get(util.format(perfix + '%s/hostname', data.ip), function(error, body, resp) {
    if (error) {
      return errorRes(error);
    }
    var hostname = body.node.value;
    data.hostname = hostname;
    data.markedAt = (new Date()).valueOf();
    models.Benchs.create(data, function(err) {
      if (err) {
        return errorRes(err);
      }
      models.Hostvars.set(util.format(perfix + '%s/has_problems', data.ip), 'yes', function(error, body, resp) {
        if (error) {
          return errorRes(error);
        }
        fetchCurrentAll(models.Benchs, function(err, data) {
          res.status(201).json(data);
        });
      });
    });
  });
};

exports.del = function del(req, res) {
  var models = req.app.get('models');
  var perfix = models.Hostvars.perfix;
  var data = req.body;
  var count = data.length;

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
        return errorRes(err);
      }
      models.Hostvars.set(util.format(perfix + '%s/has_problems', bench.ip), 'no', function(error, body, resp) {
        if (error) {
          return errorRes(error);
        }
        count--;
        if (count === 0) {
          fetchCurrentAll(models.Benchs, function(err, data) {
            res.json(data);
          });
        }
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
            res.json(result);
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
    res.json(data);
  });
};
