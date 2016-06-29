var _ = require('lodash');
var Store = require('./store');
var inherits = require('util').inherits;

function EventStore() {
  Store.call(this);
}

inherits(EventStore, Store);

EventStore.prototype.update = function update(id, events) {
  this.objects = [];
  this.store(events);
};

EventStore.prototype.toArray = function() {
  var self = this;
  return _.sortByOrder(
    Object.keys(self.objects).map(function(key) {
      return {
        key: key,
        value: self.objects[key],
      };
    }),
    function(event) {
      return event.key;
    },
    'desc'
  );
};

EventStore.prototype.store = function(events) {
  var self = this;
  if (events) {
    events.forEach(function(event) {
      self.objects[event.lastEvent.eventid] = event;
    });
    this.emit('change', this.toArray());
  }
};

EventStore.prototype.receive = function(data) {
  var action = data.id.slice(data.id.indexOf('-') + 1);
  if (action === 'list') {
    this.store(data.list);
  }
  else if (action === 'update') {
    this.update(null, data.update);
  }
};

module.exports = new EventStore();
