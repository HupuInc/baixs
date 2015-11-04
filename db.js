var levelup = require('levelup');
var Etcd = require('node-etcd');

var dbConfig = require('./config').database;
var etcdConfig = require('./config').etcd;

var leveldb = levelup(
  dbConfig.file,
  {
    db: require(dbConfig.backend),
    valueEncoding: 'json'
  }
);

var etcd = new Etcd(etcdConfig.host, etcdConfig.port);

var instance = {
  leveldb: leveldb,
  etcd: etcd
};

module.exports = instance;
