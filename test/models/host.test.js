require('should');
var bootstrap = require('../');
var models = bootstrap.models;
var Host = models.Host;

var doc = {
  ip: '192.168.7.6',
  hostname: 'sample-7-6-prd',
  has_problems: 'no',
};

var host = new Host(doc);

describe('Model - Link', function() {
  describe('Attributes', function() {
    it('should have some properties', function() {
      host.should.have.property('doc', doc);
      host.should.have.property('ip', doc.ip);
      host.should.have.property('hostname', doc.hostname);
      host.should.have.property('has_problems', doc.has_problems);
    });
  });

  describe('Method - Host.save', function() {
    before(function(done) {
      host.save(done);
    });

    after(function(done) {
      Host.leveldb.del(host.id, done);
    });

    it('can be read from db again', function(done) {
      Host.leveldb.get(host.id, function(err, obj) {
        obj.should.eql(doc);
        done(err);
      });
    });

    it('should generate a hostname to ip record', function(done) {
      Host.leveldb.get('host:' + host.hostname, function(err, doc) {
        doc.should.eql(host.ip);
        done(err);
      });
    });

    describe('Method - Host.fetch', function() {
      it('should return an instance of Host', function(done) {
        Host.fetch(host.id, function(err, host) {
          host.should.be.an.instanceOf(Host);
          host.doc.should.eql(doc);
          done(err);
        });
      });
    });

    describe('Method - Host.fetchByName', function() {
      it('should return an instance of Host', function(done) {
          Host.fetchByName(host.hostname, function(err, host) {
          host.should.be.an.instanceOf(Host);
          host.doc.should.eql(doc);
          done(err);
        });
      });
    });

    describe('Method - Host.fetchByIp', function() {
      it('should return an instance of Host', function(done) {
          Host.fetchByIp(host.ip, function(err, host) {
          host.should.be.an.instanceOf(Host);
          host.doc.should.eql(doc);
          done(err);
        });
      });
    });

  });
});
