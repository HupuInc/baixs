var Link = require('./link');
var Hostvars = require('./hostvars');
var Benchs = require('./benchs');

module.exports = function(leveldb, etcd, zapi) {

  Link.leveldb = leveldb;
  Hostvars.etcd = etcd;
  Benchs.leveldb = leveldb;
  Benchs.zapi = zapi;

  return {
    Link: Link,
    Hostvars: Hostvars,
    Benchs: Benchs,
  };
};
