var should = require('should');
var nock = require('nock');
var request = require('supertest');
var _ = require('lodash');
var init = require('../../../app');
var server;

describe('controllers', function() {
  var newHost = {
    ip: '192.168.20.84',
  };

  before(function(done) {
    init(function(instance) {
      server = instance;
      done();
    });
  });

  after(function(done) {
    var Benchs = server.get('models').Benchs;
    Benchs.fetchHistory(0, 9, function(err, benches) {
      _.forEach(benches, function(bench) {
        if (bench.data.ip === newHost.ip) {
          return bench.del(done);
        }
      });
    });
  });

  before(function() {
    this.scope = nock('http://localhost:4001')
    .get('/v2/keys/hostvars/' + newHost.ip + '/hostname')
    .reply(200, {
      node: {
        'key': '/hostvars/' + newHost.ip + '/hostname',
        'value': 'kq-fake-20-84-prd.vm',
      },
    });
  });

  after(function() {
    this.scope.done();
  });

  describe('Benchs API', function() {
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

    describe('Mark duplication of host into benches', function() {
      it('should return a list of hosts which were in the benches', function(done) {
        request(server)
          .put('/api/benchs')
          .send(newHost)
          .set('Accept', 'application/json')
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.instanceof(Array).and.have.lengthOf(1);
          });
        var end = new Date().valueOf() / 1000 + 3600;
        var start = end - 86400 - 3600;
        request(server)
          .get('/api/history?start' + parseInt(start) + '&end=' + parseInt(end))
          .set('Accept', 'application/json')
          .expect(200)
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
