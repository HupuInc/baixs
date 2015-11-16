var db = require('../db');

var models = {};
var modelsToLoad = ['Link', 'Hostvars', 'Benchs', 'Host', 'Event'];
modelsToLoad.forEach(function(className) {
  var TheClass = require(__dirname + '/' + className.toLowerCase());
  TheClass.leveldb = db.leveldb;
  TheClass.etcd = db.etcd;

  models[className] = TheClass;
});

module.exports = models;
