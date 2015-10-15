var Link = require('./link');
var Task = require('./task');
var Hostvars = require('./hostvars');
var Benchs = require('./benchs');

module.exports = function(leveldb, etcd, zapi) {

  Link.leveldb = leveldb;
  Task.leveldb = leveldb;
  Hostvars.etcd = etcd;
  Benchs.leveldb = leveldb;
  Benchs.zapi = zapi;

  return {
    Link: Link,
    Task: Task,
    Hostvars: Hostvars,
    Benchs: Benchs,
  };
};
