var EventEmitter = require('events').EventEmitter;
var util = require('util');
/*
The way how Crawler works:
  - enqueue Link
  - When finished:
      # update Link stats
      # query if the Link's host existed:
        - if yes, enqueue again
        - if no, exit
*/
function Crawler() {
  EventEmitter.call(this);
  this.queue = [];
}

util.inherits(Crawler, EventEmitter);

function requestEvent(task) {
  var self = this;
  return function(events) {
    self._startOnce(task);
    self.emit('end', task.id, events);
  };
}

function requestEnded(link) {
  var prevStatus = link.doc.status < 401;
  var id = link.id;
  var self = this;

  return function(link) {
    var currentStatus = link.doc.status < 401;
    if (currentStatus !== prevStatus) {
      // normal status is 1
      self.emit('change', currentStatus ? 1 : 0, link);
    }

    if (self.contains(link)) {
      // don't write back to db if it's removed from queue
      self._startOnce(link);
      self.emit('end', id, link);
    }
    else {
      self.emit('end');
    }
  };
}

Crawler.prototype._startOnce = function(task) {
  if (task.id === 'events') {
    task.once('end', requestEvent.bind(this)(task));
  }
  else {
    task.once('end', requestEnded.bind(this)(task));
  }
  task.start();
};

Crawler.prototype.contains = function(task) {
  return this.queue.indexOf(task.id) > -1;
};

Crawler.prototype.dequeue = function(task) {
  var result = false;
  var pos = this.queue.indexOf(task.id);
  if (pos > -1) {
    this.queue.splice(pos, 1);
    result = true;
  }
  return result;
};

Crawler.prototype.enqueue = function(task) {
  var result = this.contains(task);
  if (!result) {
    this.queue.push(task.id);
    this._startOnce(task);
  }
  return result;
};

module.exports = Crawler;
