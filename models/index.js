var request = require('request');
var shasum = require('shasum');
var util = require('util');
var _ = require('lodash');

var Link = {
  ns: 'link\0%s'
};

Link.uuid = function(doc, done) {
  var keyObj = {
    url: doc.url,
    proxy: doc.proxy || null
  };
  return util.format(this.ns, shasum(keyObj));
};

function Task(link) {
  var linkId = Link.uuid(link);
  this.createdAt = (new Date).valueOf();
  this.uuid = util.format(Task.ns, linkId, this.createdAt);
  this.link = link;
}

// The key of Task contains:
// - uuid value of link
// - creation timestamp (in milisecond) as the key
Task.ns = 'task\0%s\0%s';

// default to run task every 1 minute
Task.interval = 60 * 1000;

// default to 20 seconds
Task.timeout = 20 * 1000;

Task.sched = function(task, done) {
  setTimeout(function() {
    task.run(done);
  }, this.interval);
};

Task.prototype.sched = function(done) {
  Task.sched(this, done);
};

Task.prototype.run = function(done) {
  var self = this;
  request({
    url: this.link.url,
    proxy: this.link.proxy,
    followRedirect: false,
    timeout: Task.timeout
  }, function(err, resp) {
    if (err) {
      done(err);
    }
    else {
      self.endAt = (new Date).valueOf();
      self.link.status = resp.statusCode
      self.link.lastTime = self.endAt;

      self.save(done);
    }
  });
};

module.exports = function(leveldb) {

  Link.update = function(doc, done) {
    var id = this.uuid(doc);
    leveldb.put(id, doc, { valueEncoding: 'json' }, done);
  };

  Link.create = Link.update;

  Task.update = function(doc, done) {
    var uuid = doc.uuid;
    delete doc.uuid;
    leveldb.put(uuid, doc, { valueEncoding: 'json' }, done);
  };

  Task.prototype.save = function(done) {
    var doc = _.omit(this, _.isFunction);
    Task.update(doc, done);
  };

  return {
    Link: Link,
    Task: Task,
  };
};
