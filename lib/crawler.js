var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Crawler() {
  EventEmitter.call(this);
  this.queue = [];
}

util.inherits(Crawler, EventEmitter);

function requestEnded(link) {
  if (this.contains(link)) {
    this._startOnce(link);
  }

  this.emit('end', link);
}

Crawler.prototype._startOnce = function(link) {
  link.once('end', requestEnded.bind(this));
  link.start();
};

Crawler.prototype.contains = function(link) {
  return this.queue.indexOf(link.id) > -1;
}

Crawler.prototype.dequeue = function(link) {
  var result = false;
  var pos = this.queue.indexOf(link.id);
  if (pos > -1) {
    this.queue.splice(pos);
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