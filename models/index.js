var models = {};
var modelsToLoad = ['Link', 'Hostvars', 'Benchs'];

module.exports = function(leveldb, etcd, zapi) {

  modelsToLoad.forEach(function(className) {
    var TheClass = require(__dirname + '/' + className.toLowerCase());
    TheClass.leveldb = leveldb;
    TheClass.etcd = etcd;
    TheClass.zapi = zapi;

    models[className] = TheClass;
  });

  return models;
};
