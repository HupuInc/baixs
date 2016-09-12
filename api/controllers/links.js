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
