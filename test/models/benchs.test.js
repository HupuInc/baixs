var nock = require('nock');
var should = require('should');
var bootstrap = require('../');
var fixture = require('../fixture');

var models = bootstrap.models;
var Benchs = models.Benchs;

describe('Model - Benchs', function() {

  before(function(done) {
    var batched = Benchs.leveldb.batch();
    fixture.benches.forEach(function(item) {
      batched.put(item.key, item.value);
    });
    batched.write(done);
  });

  after(function(done) {
    var batched = Benchs.leveldb.batch();
    fixture.benches.forEach(function(item) {
      batched.del(item.key);
    });
    batched.write(done);
  });

  describe('Fetch all the benchs', function() {
    it('should return a list of hosts in the benchs', function(done) {
      Benchs.fetchCurrentAll(function(err, hosts) {
        should.not.exist(err);
        hosts.should.be.an.Array;
        hosts.should.have.lengthOf(3);
        done();
      });
    });
  });

  describe('Move a host out from benchs', function() {
    var benchToMove = fixture.benches[0];
    it('should remove the host from benchs list, and make a new history record', function(done) {
      Benchs.move2history(benchToMove.value, function(err) {
        should.not.exist(err);

        Benchs.leveldb.get(benchToMove.key, function(err, item) {
          err.should.have.property('type').eql('NotFoundError');
          should.not.exist(item);

          var key = Benchs.hisUuid(benchToMove.value);
          Benchs.leveldb.get(key, function(err, historyBench) {
            should.not.exist(err);
            historyBench.should.have.properties('ip', 'hostname', 'markedAt');
            done();
          });
        });
      });
    });
  });

  describe('Fetch all the historical benchs', function() {
    it('should return a list of hosts which were in the benchs', function(done) {
      var now = parseInt((new Date()).valueOf() / 1000);
      var start = now - 60; // a minute ago
      Benchs.fetchHistory(start, now, function(err, list) {
        should.not.exist(err);
        list.should.be.an.Array;
        list.should.have.lengthOf(1);
        done();
      });
    });
  });
});
