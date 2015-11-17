var LinkStore = require('./store/link');
var EventStore = require('./store/event');

function Postoffice() {
  this.addressBook = {
    'link': LinkStore,
    'event': EventStore,
  };
}

Postoffice.prototype.collect = function(evt) {
  var data = JSON.parse(evt.data);
  var address = data.id.slice(0, data.id.indexOf('-'));
  this.sorter(address, data);
};

Postoffice.prototype.sorter = function(address, data) {
  var target = this.addressBook[address];
  if (target) {
    this.ship(target, data);
  }
  else {
    console.log('Oops, the address of ' + address + ' does not exists.');
  }
};

Postoffice.prototype.ship = function(target, data) {
  target.emit('receive', data);
};

module.exports = new Postoffice();
