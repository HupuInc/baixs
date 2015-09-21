var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');

// To check all the links every 1 minute
var CHECK_INTERVAL = process.env.CHECK_INTERVAL || 30 * 1000;
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

  function sync() {
    function fetch(hosts) {
      var problems = [],
        perfix = models.Hostvars.perfix;
      models.Benchs.fetchCurrentAll()
        .on('data', function(data) {
          problems.push(data);
          models.Hostvars.get(util.format(perfix + '%s/has_problems', data.value.ip), function(error, body, resp) {
            if (error || body.node.value === 'no') {
              data.value.releaseAt = (new Date()).valueOf();
              models.Benchs.move2history(data.value, function(){});
            }
          });
        })
        .on('err', function(err) {
          console.error(err);
        })
        .on('close', function() {
          emitter.emit('sync', hosts, problems);
        });
    }
    models.Hostvars.fetchHasProblems(fetch);
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
        // TODO only broadcast updated link, i.e. task.link
        models.Link.fetchAll(function(err, links) {
          self.channel.broadcast(
            JSON.stringify({
              id: 'link-update',
              update: links
            })
          );
        });
      }
    });
  });

  this.syncTimer = setInterval(sync, CHECK_INTERVAL);
  emitter.on('sync', function(benchs, problems) {
    _.forEach(benchs, function(bench) {
      var id = models.Benchs.uuid(bench);
      if (!_.find(problems, { 'key': id })) {
        bench.markedAt = (new Date()).valueOf();
        models.Benchs.create(bench, function() {});
      }
    });
  });

};

Cron.prototype.stop = function() {
  clearInterval(this.timer);
};

module.exports = Cron;
