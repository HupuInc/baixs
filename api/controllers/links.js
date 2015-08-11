var _ = require('lodash');

exports.getLinks = function getLinks(req, res) {
  var results = ['url\tlastResTime\tavgResTime\tcount'];
  var tmpl = _.template('<%=url%>\t<%=lastResTime%>\t<%=avgResTime%>\t<%=count%>');

  req.app.get('models').Link.fetchAll()
    .on('data', function(aLink) {
      results.push(tmpl(aLink.value));
    })
    .on('end', function() {
      res.type('.txt').send(results.join('\n') + '\n');
    })
    .on('err', function(err) {
      console.error(err);
    });
};

exports.create = function create(req, res) {
  var models = req.app.get('models');
  models.Link.create(req.body, function(err) {
    if (err) {
      res.status(400).json({
        message: err.toString()
      });
    }
    res.status(201).send(void 0);
  });
};
