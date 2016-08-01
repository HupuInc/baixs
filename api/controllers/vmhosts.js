var _ = require('lodash');

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
