var should = require('should');
var nock = require('nock');
var fixture = require('../../fixture');
var request = require('supertest');
var init = require('../../../app');
var server;

describe('controllers', function() {
  var vmmOne = fixture.vmmOne;
  var vmHostOne = fixture.vmHostOne;
  var vmHostTwo = fixture.vmHostTwo;
  var vmHostThree = fixture.vmHostThree;

  var mockedResponse = {
    "node": {
      "key": "/hostvars",
      "dir": true,
      "nodes": [ vmmOne, vmHostOne, vmHostTwo, vmHostThree ]
    },
    "modifiedIndex": 3,
    "createdIndex": 3,
    "action": "get"
  };

  before(function(done) {
    init(function(instance) {
      server = instance;
      done();
    });
  });

  describe('hostvars API', function() {
    describe('GET /vm_search', function() {
      it('should return the specifying vmm host', function(done) {
        var scope = nock('http://localhost:4001/')
          .get('/v2/keys/hostvars/')
          .query({ recursive: true })
          .reply(200, mockedResponse);

        request(server)
          .get('/api/vm_search?q=20.83')
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.have.lengthOf(1);
            res.body[0].should.have.property('domain').with.lengthOf(1);
            done();
          });
      });
    });
  });
});