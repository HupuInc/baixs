var _ = require('lodash');

exports.getLinks = function getLinks(req, res) {
  var results = ['url\t\tproxy\t\tlastResTime\tavgResTime\tcount'];
  var tmpl = _.template('<%=url%>\t<%=proxy%>\t<%=lastResTime%>\t<%=avgResTime%>\t<%=count%>');

  req.app.get('models').Link.fetchAll(function(err, links) {
    if(err) {
      console.error(err);
    }
    else {
      var defaultLink = {
        proxy: '',
        lastResTime: '',
        avgResTime: '',
        count: 0,
      };

      links.forEach(function(aLink) {
        results.push(
          tmpl(_.defaults(aLink.doc, defaultLink))
        );
      });
      res.type('.txt').send(results.join('\n') + '\n');
    }
  });
};

exports.create = function create(req, res) {
  var Link = req.app.get('models').Link;
  var crawler = req.app.get('crawler');

  var link = new Link(req.body);
  link.save(function(err) {
    if (err) {
      res.status(400).json({ message: err.toString() });
    }
    else {
      crawler.enqueue(link);
      res.status(201).json(link);
    }
  });
};

exports.del = function del(req, res) {
  var crawler = req.app.get('crawler');
  var models = req.app.get('models');
  var id = req.swagger.params.id.value;

  function handleError(err) {
    res.status(400).json({ message: err.toString() });
  }

  models.Link.fetch(id, function(err, link) {
    if (err) {
      return handleError(err);
    }

    crawler.dequeue(link);
    link.del(function(err) {
      if (err) {
        return handleError(err);
      }
      res.status(200).json(link);
    });
  });
};
