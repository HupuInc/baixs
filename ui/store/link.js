var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var CHANGE_EVENT = 'change';

var links = {};

function LinkStore() {
  EventEmitter.call(this);
}

inherits(LinkStore, EventEmitter);

LinkStore.prototype.update = function update(id, doc) {
  links[id] = doc
  this.emit(CHANGE_EVENT, this.toArray());
};

LinkStore.prototype.remove = function remove(id) {
  delete links[id];
  this.emit(CHANGE_EVENT, this.toArray());
};

LinkStore.prototype.toArray = function() {
  return Object.keys(links).map(function(key) {
    return {
      key: key,
      value: links[key]
    };
  });
};

LinkStore.prototype.parse = function(evt) {
  var data = JSON.parse(evt.data);

  if (data.id === 'link-list') {
    data.list.forEach(function(item) {
      links[item.key] = item.value;
    });
    this.emit(CHANGE_EVENT, this.toArray());
  }
  else if (data.id === 'link-update') {
    var item = data.update;
    this.update(item.key, item.value);
  }
};

module.exports = new LinkStore();
