var request = require('request');
var shasum = require('shasum');
var util = require('util');

var NS = 'task:%s:%s';

// The key of Task contains:
// - creation timestamp (in milisecond) as the key
function Task(doc) {
  this.createdAt = (new Date()).valueOf();
  this.link = doc;
}

// default to run task every 1 minute
Task.interval = 60 * 1000;

// default to 20 seconds
Task.timeout = 20 * 1000;

Task.sched = function(task, done) {
  setTimeout(function() {
    task.run(done);
  }, this.interval);
};

Task.prototype._updateStats = function(ifSuccess, timeSpent, statusCode) {
  if (ifSuccess) {
    this.link.status = statusCode;
    this.link.lastResTime = timeSpent;
    this.link.count = this.link.count || 0;

    // calculate average response time
    if (this.link.count > 0) {
      var count = this.link.count;
      var avgResTime = this.link.avgResTime;
      this.link.avgResTime = Math.round(
        ((avgResTime * count) + timeSpent) / (count + 1)
      );
    }
    else {
      this.link.avgResTime = timeSpent;
    }

    this.link.count ++;
  }
  else {
    this.link.status = null;
  }
};

Task.prototype.sched = function(done) {
  Task.sched(this, done);
};

Task.prototype.run = function(done) {
  var self = this;

  request.get({
    url: this.link.url,
    proxy: this.link.proxy,
    followRedirect: false,
    timeout: Task.timeout
  }, function(err, resp, body) {
    self.endAt = (new Date()).valueOf();
    var timeSpent = self.endAt - self.createdAt;
    var ifSuccess = true;

    if (err) {
      ifSuccess = false;
    }

    self._updateStats(ifSuccess, timeSpent, resp && resp.statusCode);
    done();
  });
};

module.exports = Task;
