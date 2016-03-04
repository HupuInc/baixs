var _ = require('lodash');
var Store = require('./store');
var inherits = require('util').inherits;

function LinkStore() {
  Store.call(this);
  this.updatedItems = 0;
}

inherits(LinkStore, Store);

LinkStore.prototype.update = function update(id, doc) {
  this.objects[id] = doc;
  this.updatedItems ++;

  if (this.updatedItems >= _.size(this.objects) * 0.2) {
    this.updatedItems = 0;
    this.emit(Store.CHANGE_EVENT, this.toArray());
  }
};

LinkStore.prototype.toArray = function() {
  var self = this;
  return _.sortByOrder(
    Object.keys(self.objects).map(function(key) {
      return {
        key: key,
        value: self.objects[key],
      };
    }),
    function(link) {
      return link.value.status;
    },
    'desc'
  );
};

module.exports = new LinkStore();
