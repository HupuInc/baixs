exports.getLinks = function getLinks(req, res) {
  var fakeLink = {
    url: 'api.hupu.com',
    status: 200,
    description: 'A url being used by iBilling'
  };

  res.json(fakeLink);
};

exports.create = function create(req, res) {
  var models = req.app.get('models');
  models.Link.create(req.body, function(err, doc) {
    if (err) {
      res.status(400).json({
        message: err.toString()
      });
    }
    res.status(201)
  });
};
