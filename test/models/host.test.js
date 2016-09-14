var should = require('should');
var _ = require('lodash');
var bootstrap = require('../');
var models = bootstrap.models;
var Host = models.Host;

var doc = {
  ip: '192.168.7.6',
  hostname: 'sample-7-6-prd',
  has_problems: 'no',
};

var host = new Host(doc);

describe('Model - Host', function() {
  describe('Attributes', function() {
    it('should have some properties', function() {
      host.should.have.property('doc', doc);
      host.should.have.property('ip', doc.ip);
      host.should.have.property('hostname', doc.hostname);
      host.should.have.property('has_problems', doc.has_problems);
      host.should.have.property('labels');
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

    describe('Method - Host.fetchAll', function() {
      var doc1 = {
        ip: '192.168.1.1',
        hostname: 'baixs-web-1-1-prd',
      };

      var doc2 = {
        ip: '192.168.1.2',
        hostname: 'gitlab-store-1-2-tst',
        vip: '192.168.1.22',
      };

      var hostOne = new Host(doc1);
      var hostTwo = new Host(doc2);

      before(function(done) {
        hostOne.save(done);
      });

      before(function(done) {
        hostTwo.save(done);
      });

      after(function(done) {
        var ops = [];
        Host.leveldb.createKeyStream()
          .on('data', function(aKey) {
            ops.push({ type: 'del', key: aKey });
          })
          .on('end', function() {
            Host.leveldb.batch(ops, done);
          });
      });

      it('should a list of hosts', function(done) {
        Host.fetchAll(function(err, hosts) {
          should.not.exist(err);
          hosts.should.be.an.Array;
          hosts.length.should.above(0);

          _.some(hosts, function(aHost) {
            return aHost.id == hostOne.id;
          }).should.be.true;

          _.some(hosts, function(aHost) {
            return aHost.id == hostTwo.id;
          }).should.be.true;

          done();
        });
      });
    });
  });
});
