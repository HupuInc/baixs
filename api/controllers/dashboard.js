var _ = require('lodash');

exports.mttr = function mttr(req, res) {
  var end = parseInt(new Date().valueOf() / 1000);
  var start = end - 86400 * 7;
  var mttrArray = {};

  var Benchs = req.app.get('models').Benchs;
  Benchs.fetchHistory(start, end, function(error, histories) {
    if (error) {
      return res.status(400).json(error);
    }

    histories.forEach(function(history) {
      var hostname = history.data.hostname;
      var project = hostname.split('-')[0];
      var during = parseInt((history.data.releaseAt - history.data.markedAt) / 1000);
      if (!_.has(mttrArray, project)) {
        mttrArray[project] = {
          'project': project,
          'hosts': [],
          'mttr': 0,
          'rate': 0,
        };
      }
      if (-1 === mttrArray[project].hosts.indexOf(hostname)) {
        mttrArray[project].hosts.push(hostname);
      }
      mttrArray[project].mttr += during;
      mttrArray[project].rate = parseFloat(mttrArray[project].mttr / (7 * 86400) / mttrArray[project].hosts.length).toFixed(4);
    });
    res.json(mttrArray);
  });
};

exports.vmmRate = function vmmRate(req, res) {

};
