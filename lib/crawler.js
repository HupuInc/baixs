var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Crawler() {
  EventEmitter.call(this);
  this.queue = [];
}

util.inherits(Crawler, EventEmitter);

function requestEnded(link) {
  var prevStatus = link.status < 400;
  var self = this;

  return function(link) {
    var currentStatus = link.status < 400;
    if (currentStatus !== prevStatus) {
      // normal status is 1
      self.emit('change', currentStatus ? 1 : 0, link);
    }

    if (self.contains(link)) {
      // don't write back to db if it's removed from queue
      link.save(function(err) {
        self._startOnce(link);
        self.emit('end', link);
      });
    }
    else {
      self.emit('end');
    }
  };
}

Crawler.prototype._startOnce = function(link) {
  link.once('end', requestEnded.bind(this)(link));
  link.start();
};

Crawler.prototype.contains = function(link) {
  return this.queue.indexOf(link.id) > -1;
};

Crawler.prototype.dequeue = function(link) {
  var result = false;
  var pos = this.queue.indexOf(link.id);
  if (pos > -1) {
    this.queue.splice(pos, 1);
    result = true;
  }
  return result;
};

Crawler.prototype.enqueue = function(link) {
  var result = this.contains(link);
  if (!result) {
    this.queue.push(link.id);
    this._startOnce(link);
  }
  return result;
};

module.exports = Crawler;
