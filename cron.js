var EventEmitter = require('events').EventEmitter;

// To check all the links every 1 minute
var CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60 * 1000;
var emitter = new EventEmitter();

function Cron(db) {
  this.models = db.models;
  this.db = db.instance;
}

Cron.prototype.start = function() {
  var models = this.models

  function dispatch() {
    // fetch all the Links
    models.Link.fetchAll()
      .on('data', function(aLink) {
        emitter.emit('data', aLink);
      })
      .on('err', function(err) {
        console.error(err);
      });
  }

  this.timer = setInterval(dispatch, CHECK_INTERVAL);
  emitter.on('data', function execute(data) {
    var task = new models.Task(data.value);
    task.run(function(err) {
      if (err) {
        console.trace(err);
      }
    });
  });

};

Cron.prototype.stop = function() {
  clearInterval(this.timer);
};

module.exports = Cron;
