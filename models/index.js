var shasum = require('shasum');
var util = require('util');

module.exports = function(leveldb) {
  var Link = {
    ns: 'link\0%s'
  };

  Link.uuid = function(doc, done) {
    var keyObj = {
      url: doc.url,
      proxy: doc.proxy
    };
    return util.format(this.ns, shasum(keyObj));
  };

  Link.update = function(doc, done) {
    var id = this.uuid(doc);
    leveldb.put(id, doc, { valueEncoding: 'json' }, done);
  };

  Link.create = Link.update;

  return {
    Link: Link
  };
};
