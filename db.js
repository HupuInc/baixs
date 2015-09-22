var levelup = require('levelup');
var dbConfig = require('./config').database;
var etcdConfig = require('./config').etcd;
var zabbixConfig = require('./config').zabbix;
var initModels = require('./models');
var Etcd = require('node-etcd');
var zabbix = require('zabbix-node');

module.exports = function open(done) {
  var zapi = new zabbix(zabbixConfig.url, zabbixConfig.user, zabbixConfig.password);
  var leveldb = levelup(
    dbConfig.file,
    {
      db: require(dbConfig.backend),
      valueEncoding: 'json'
    },
    function() {
      zapi.login(function() {
        done();
      });
    }
  );

  var etcd = new Etcd(etcdConfig.host, etcdConfig.port);

  return {
    models: initModels(leveldb, etcd, zapi),
    instance: leveldb,
  };
};
