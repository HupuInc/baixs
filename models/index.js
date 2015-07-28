var shasum = require('shasum');
var util = require('util');

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

function Task(link) {
  this.id = Link.uuid(link);
  this.createdAt = (new Date).valueOf();
  this.key = util.format(Task.ns, this.id, this.createdAt);
  this.link = link;
}

// The key of Task contains:
// - uuid value of link
// - creation timestamp (in milisecond) as the key
Task.ns = 'task\0%s\0%s';
// Default to run task every 1 minute
Task.interval = 60 * 1000;

module.exports = function(leveldb) {

  Link.update = function(doc, done) {
    var id = this.uuid(doc);
    leveldb.put(id, doc, { valueEncoding: 'json' }, done);
  };

  Link.create = Link.update;

  return {
    Link: Link,
    Task: Task,
  };
};
