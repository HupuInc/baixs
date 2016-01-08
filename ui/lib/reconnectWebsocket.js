var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var _ = require('lodash');

var defaultSettings = {
  reconnectInterval: 10000,
  timeoutInterval: 2000,
};

function ReconnectWebsocket(url, protocols, option) {
  EventEmitter.call(this);
  this.url = url;
  this.protocols = protocols || [];
  option = option || {};
  this.settings = _.merge(defaultSettings, option);
  this.on('open', this.open.bind(this));
  this.emit('open');
}

inherits(ReconnectWebsocket, EventEmitter);

ReconnectWebsocket.prototype.open = function open() {
  console.log('open');
  var self = this;
  this.ws = new WebSocket(this.url, this.protocols);

  this.timeout = setTimeout(function() {
    self.ws.close();
  }, self.settings.timeoutInterval);

  this.ws.onclose = function(ev) {
    clearTimeout(self.timeout);
    if (ev.code === 1000) {
      console.log('close origin');
      return;
    }
    self.ws = null;
    console.log('onclose');
    setTimeout(function() {
      console.log('reconnect start');
      self.emit('open');
    }, self.settings.reconnectInterval);
  };

  this.ws.onopen = function() {
    clearTimeout(self.timeout);
    console.log('onopen');
  };

  this.ws.onmessage = function(event) {
    clearTimeout(self.timeout);
    console.log('onmessage');
    self.emit('onmessage', event);
  };
};

ReconnectWebsocket.prototype.close = function close(code) {
  code = code || 1000;
  if (this.ws) {
    ws.close(code);
  }
};

module.exports = ReconnectWebsocket;
