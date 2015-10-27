var should = require('should');
var request = require('supertest');
var _ = require('lodash');

var init = require('../../../app');
var server;
var crawler = {
  dequeue: function() {},
  enqueue: function() {},
  contains: function() {}
};

describe('controllers', function() {
  var newLink = {
    url: 'http://localhost'
  };

  before(function(done) {
    init(function(instance) {
      server = instance;
      server.set('crawler', crawler);
      done();
    });
  });

  after(function(done) {
    var Link = server.get('models').Link;
    new Link(newLink).del(done);
  });

  describe('Links API', function() {
    describe('POST /links', function() {
      it('should create a new Link', function(done) {
        request(server)
          .post('/api/links')
          .send(newLink)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);
            var result = res.body;
            result.should.have.properties('key', 'value');
            result.value.should.eql(newLink);
            done();
          });
      });

      it('should fail if a link does not have property url', function(done) {
        var newLink = {
          proxy: 'random proxy',
          description: 'a link only for testing'
        };
        request(server)
          .post('/api/links')
          .send(newLink)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            done();
          });
      });
    });
  });
});
