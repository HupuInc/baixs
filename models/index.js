var models = {};
var modelsToLoad = ['Link', 'Hostvars', 'Benchs'];

module.exports = function(leveldb, etcd) {

  modelsToLoad.forEach(function(className) {
    var TheClass = require(__dirname + '/' + className.toLowerCase());
    TheClass.leveldb = leveldb;
    TheClass.etcd = etcd;

    models[className] = TheClass;
  });

  return models;
};
