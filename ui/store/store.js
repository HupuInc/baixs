var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var CHANGE_EVENT = 'change';

function Store() {
  EventEmitter.call(this);
  this.objects = {};
  this.on('receive', this.receive);
}

Store.CHANGE_EVENT = CHANGE_EVENT;

inherits(Store, EventEmitter);

Store.prototype.update = function update(id, doc) {
  this.objects[id] = doc;
  this.emit(CHANGE_EVENT, this.toArray());
};

Store.prototype.remove = function remove(id) {
  delete this.objects[id];
  this.emit(CHANGE_EVENT, this.toArray());
};

Store.prototype.toArray = function() {
  var self = this;
  return Object.keys(self.objects).map(function(key) {
    return {
      key: key,
      value: self.objects[key],
    };
  });
};

Store.prototype.receive = function(data) {
  var self = this;
  var action = data.id.slice(data.id.indexOf('-') + 1);
  if (action === 'list') {
    this.store(data);
  }
  else if (action === 'update') {
    var item = data.update;
    self.update(item.key, item.value);
  }
};

Store.prototype.store = function(data) {
  var self = this;
  data.list.forEach(function(item) {
    self.objects[item.key] = item.value;
  });
  this.emit(CHANGE_EVENT, this.toArray());
};

module.exports = Store;
