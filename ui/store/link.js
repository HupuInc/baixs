var _ = require('lodash');
var Store = require('./store');
var inherits = require('util').inherits;

function LinkStore() {
  Store.call(this);
}

inherits(LinkStore, Store);

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
