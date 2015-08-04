var EventEmitter = require('events').EventEmitter;

// To check all the links every 1 minute
var CHECK_INTERVAL = 60 * 1000;
var emitter = new EventEmitter();

function execute(aLink) {
  var task = new Task(aLink);
  task.run();
}

function Cron(models) {
  this.models = models;
}

Cron.prototype.start = function() {
  var self = this;

  function dispatch() {
    // fetch all the Links
    self.models.Link.fetchAll()
      .on('data', function(aLink) {
        emitter.emit('data', aLink);
      })
      .on('err', function(err) {
        console.error(err);
      });
  }

  this.timer = setInterval(dispatch, CHECK_INTERVAL);
  emitter.on('data', execute);
};

Cron.prototype.stop = function() {
  clearInterval(this.timer);
};

module.exports = Cron;
