var should = require('should');
var nock = require('nock');
var request = require('supertest');
var _ = require('lodash');
var init = require('../../../app');
var server;

describe('controllers', function() {
  var newHost = {
    ip: '192.168.20.84'
  };

  before(function(done) {
    init(function(instance) {
      server = instance;
      done();
    });
  });

  after(function(done) {
    var benchs = server.get('models').Benchs;
    benchs.fetchHistory(0, 9, function(err, hosts) {
      _.forEach(hosts, function(host) {
        if (host.value.ip === newHost.ip) {
          return benchs.del(host.key, done);
        }
      });
    });
  });

  describe('Benchs API', function() {
    var scope = nock('http://localhost:4001')
      .get('/v2/keys/hostvars/' + newHost.ip + '/hostname')
      .reply(200, {
        node: {
          "key": "/hostvars/" + newHost.ip + "/hostname",
          "value": "kq-fake-20-84-prd.vm",
        }
      })
      .put('/v2/keys/hostvars/' + newHost.ip + '/has_problems', {
        value: 'yes'
      })
      .reply(200, {
        node: {
          "key": "/hostvars/" + newHost.ip + "/has_problems",
          "value": "yes",
        }
      })
      .put('/v2/keys/hostvars/' + newHost.ip + '/has_problems', {
        value: 'no'
      })
      .reply(200, {
        node: {
          "key": "/hostvars/" + newHost.ip + "/has_problems",
          "value": "no",
        }
      });
    describe('PUT a problem host', function() {
      it('should return all problem hosts with the new host', function(done) {
        request(server)
          .put('/api/benchs')
          .send(newHost)
          .set('Accept', 'application/json')
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.instanceof(Array).and.have.lengthOf(1);
          });
        done();
      });
    });

    describe('DELETE a problem host', function() {
      it('should return all problem hosts without the new host', function(done) {
        request(server)
          .delete('/api/benchs')
          .send([newHost])
          .set('Accept', 'application/json')
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.instanceof(Array).and.have.lengthOf(0);
          });
        done();
      });
    });
  });
});