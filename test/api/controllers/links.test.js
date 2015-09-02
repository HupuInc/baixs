var should = require('should');
var request = require('supertest');
var _ = require('lodash');

var server = require('../../../app');

describe('controllers', function() {
  describe('Links API', function() {
    describe('POST /links', function() {
      it('should create a new Link', function(done) {
        var newLink = {
          url: 'http://localhost'
        };
        request(server)
          .post('/api/links')
          .send(newLink)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function(err, res) {
            should.not.exist(err);
            var result = res.body;
            res.body.length.should.be.above(0);
            _.some(result, function(item) {
              return _.contains(item.value, newLink.url);
            }).should.be.true;
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
          .expect('Content-Type', /html/)
          .expect(400)
          .end(function(err, res) {
            should.not.exist(err);
            done();
          });
      });
    });
  });
});
