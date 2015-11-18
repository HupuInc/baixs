var should = require('should');
var request = require('supertest');

var init = require('../../../app');

var bootstrap = require('../../');
var models = bootstrap.models;
var Host = models.Host;

describe('Hosts API', function() {
  var app;
  before(function(done) {
    init(function(instance) {
      app = instance;
      done();
    });
  });

  describe('GET /hosts', function() {
    var doc1 = {
      ip: '192.168.1.1',
      hostname: 'baixs-web-1-1-prd',
    };

    var doc2 = {
      ip: '192.168.1.2',
      hostname: 'gitlab-web-1-2-tst',
      vip: '192.168.1.22',
    };

    var doc3 = {
      ip: '192.168.1.3',
      hostname: 'baixs-web-1-3-prd',
    };

    var hostOne = new Host(doc1);
    var hostTwo = new Host(doc2);
    var hostThree = new Host(doc3);

    before(function(done) {
      hostOne.save(done);
    });

    before(function(done) {
      hostTwo.save(done);
    });

    before(function(done) {
      hostThree.save(done);
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


    it('should return a list of hosts', function(done) {
      request(app)
        .get('/api/hosts')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);

          var result = res.body;
          result.should.be.instanceOf.Object;
          result['baixs'].hosts.should.have.a.lengthOf(2);
          result['web'].hosts.should.have.a.lengthOf(3);
          result.should.have.property('_meta');
          result['_meta'].should.have.property('hostvars');

          done();
        });
    });
  });

});
