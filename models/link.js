var shasum = require('shasum');
var util = require('util');

var NS = 'link:%s';

function Link(doc) {
  this.doc = doc
  this.id = Link.uuid(doc);
}

Link.uuid = function(doc) {
  var keyObj = {
    url: doc.url,
    proxy: doc.proxy || null
  };
  return util.format(NS, shasum(keyObj));
};

Link.create = function(doc, done) {
  var link = new Link(doc);
  link.save(done);
};

Link.fetchAll = function(done) {
  var stream = Link.leveldb.createReadStream({
    gte: 'link:0',
    lte: 'link:z'
  });

  if ('function' === typeof done) {
    var links = [];
    stream.on('data', function(aLink) {
      links.push(aLink);
    })
    .on('err', done)
    .on('close', function() {
      done(null, links);
    });
  }
  else {
    return stream;
  }
};

Link.prototype.save = function(done) {
  Link.leveldb.put(this.id, this.doc, { valueEncoding: 'json' }, done);
};

Link.prototype.del = function(done) {
  Link.leveldb.del(this.id, done);
};

module.exports = Link;
