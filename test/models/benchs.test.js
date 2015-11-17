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
      Benchs.fetchCurrent(function(err, hosts) {
        should.not.exist(err);
        hosts.should.be.an.instanceof(Array).and.have.lengthOf(4);
        done();
      });
    });
  });

  describe('Fetch all the historical benchs', function() {
    it('should return a list of hosts which were in the benchs', function(done) {
      var now = parseInt((new Date()).valueOf() / 1000);
      var start = now - 60; // a minute ago
      Benchs.fetchHistory(start, now, function(err, list) {
        should.not.exist(err);
        list.should.be.an.instanceof(Array).and.have.lengthOf(1);
        done();
      });
    });
  });

  describe('Manage bench', function() {
    it('should contain the new record', function(done) {
      Benchs.create(fixture.hostFour, function() {
        var id = Benchs.uuid(fixture.hostFour);
        Benchs.leveldb.get(id, function(err, value) {
          should.not.exist(err);
          if (err) {
            done(err);
          } else {
            value.should.be.eql(fixture.hostFour);
            done();
          }
        });
      });
    });

    it('should not contain the new record', function(done) {
      var bench = new Benchs(fixture.hostFour);
      var id = bench.id;
      bench.del(function(error) {
        should.not.exist(error);
        Benchs.leveldb.get(id, function(err, value) {
          should.exist(err);
          should.not.exist(value);
          done();
        });
      });
    });
  });
});
