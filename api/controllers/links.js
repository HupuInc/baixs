var _ = require('lodash');

exports.getLinks = function getLinks(req, res) {
  var results = ['url\t\tproxy\t\tlastResTime\tavgResTime\tcount'];
  var tmpl = _.template('<%=url%>\t<%=proxy%>\t<%=lastResTime%>\t<%=avgResTime%>\t<%=count%>');

  req.app.get('models').Link.fetchAll()
    .on('data', function(aLink) {
      results.push(
        tmpl(
          _.defaults(
            aLink.value, { proxy: ''}
          )
        )
      );
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

    models.Link.fetchAll(function(err, links) {
      res.status(201).json(links);
    });
  });
};

exports.del = function del(req, res) {
  var models = req.app.get('models');
  var id = req.swagger.params.id.value
  models.Link.del(id, function(err) {
    if (err) {
      res.status(400).json({
        message: err.toString()
      });
    }
    else {
      models.Link.fetchAll(function(err, links) {
        res.status(200).json(links);
      });
    }
  });
};
