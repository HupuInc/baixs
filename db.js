var levelup = require('levelup');
var Etcd = require('node-etcd');

var dbConfig = require('./config').database;
var etcdConfig = require('./config').etcd;
var etcdAliConfig = require('./config').etcdAli;

var leveldb = levelup(
  dbConfig.file,
  {
    db: require(dbConfig.backend),
    valueEncoding: 'json',
  }
);

var etcd = new Etcd(etcdConfig.host, etcdConfig.port);
var etcdAli = new Etcd(etcdAliConfig.host, etcdAliConfig.port);

var instance = {
  leveldb: leveldb,
  etcd: etcd,
  etcdAli: etcdAli,
};

module.exports = instance;
