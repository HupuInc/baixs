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
        models.Benchs.fetchCurrentAll(function(err, benchs) {
          if (err) {
            return errorRes(err);
          }
          res.status(201).json(benchs);
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
    models.Hostvars.get(util.format(perfix + '%s/hostname', bench.ip), function(error, body, resp) {
      if (error) {
        return errorRes(error);
      }
      var hostname = body.node.value;
      bench.hostname = hostname;
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
            models.Benchs.fetchCurrentAll(function(err, benchs) {
              if (err) {
                return errorRes(err);
              }
              res.status(201).json(benchs);
            });
          }
        });
      });
    });
  });
};

exports.events = function events(req, res) {
  var models = req.app.get('models');
  var result = [];

  function calcAge(value) {
    var result = '';
    var minutes = value / 60;
    var seconds = parseInt(value % 60);
    var hours = minutes / 60;
    var days = hours / 24;
    var months = parseInt(days / 30);
    minutes = parseInt(minutes % 60);
    hours = parseInt(hours % 24);
    days = parseInt(days % 30);

    result += months === 0 ? '' : months + '月 ';
    result += days === 0 ? '' : days + '天 ';
    result += hours === 0 ? '' : hours + '小时 ';
    result += minutes === 0 ? '' : minutes + '分钟 ';
    result += seconds === 0 ? '' : seconds + '秒';
    return result;
  }

  models.Benchs.fetchCurrentEvent(function(error, resp, body) {
    if (error) {
      return res.status(400).json(error);
    }
    else {
      var count = body.length;
      _.forEach(body, function(data) {
        var hostid = data.hosts[0].hostid;
        data.age = calcAge(new Date().valueOf() / 1000 - data.lastchange);
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
            res.type('json').json(result);
          }
        });
      });
    }
  });
};

exports.history = function history(req, res) {
  var start = req.query.start;
  var end = req.query.end;

  function sender(error, data) {
    res.type('json').send(JSON.stringify(data));
  }

  var Benchs = req.app.get('models').Benchs;
  Benchs.fetchHistory(start, end, function(error, data) {
    res.type('json').send(JSON.stringify(data));
  });
};
