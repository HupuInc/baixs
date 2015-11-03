var levelup = require('levelup');
var dbConfig = require('./config').database;
var etcdConfig = require('./config').etcd;
var initModels = require('./models');
var Etcd = require('node-etcd');

module.exports = function open(done) {
  var leveldb = levelup(
    dbConfig.file,
    {
      db: require(dbConfig.backend),
      valueEncoding: 'json'
    },
    done
  );

  var etcd = new Etcd(etcdConfig.host, etcdConfig.port);

  return {
    models: initModels(leveldb, etcd),
    instance: leveldb,
  };
};
