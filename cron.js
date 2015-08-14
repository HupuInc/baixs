var EventEmitter = require('events').EventEmitter;

// To check all the links every 1 minute
var CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60 * 1000;
var emitter = new EventEmitter();

function Cron(db, channel) {
  this.models = db.models;
  this.db = db.instance;
  // channel is an instance of websocket connection
  this.channel = channel;
}

Cron.prototype.start = function() {
  var models = this.models;
  var self = this;

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
    console.log('Run a task:', task);
    task.run(function(err) {
      if (err) {
        console.trace(err);
      }
      else {
        self.channel.broadcast({
          messageId: 'refresh',
          link: task.link
        });
      }
    });
  });
};

Cron.prototype.stop = function() {
  clearInterval(this.timer);
};

module.exports = Cron;
