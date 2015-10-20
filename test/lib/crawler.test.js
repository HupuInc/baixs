var nock = require('nock');
var should = require('should');
var sinon = require('sinon');
var Crawler = require('../../lib/crawler');
var bootstrap = require('../');
var fixture = require('../fixture');

var models = bootstrap.models;
var Link = models.Link;
var linkOne = fixture.linkOne;

describe('Crawler', function() {

  before(function(done) {
    Link.create(linkOne, done);
  });

  after(function(done) {
    new Link(linkOne).del(done);
  });

  describe('Enqueue a link', function() {
    var crawler1 = new Crawler();

    before(function() {
      this.mock = sinon.mock(crawler1, '_startOnce');
    });

    after(function() {
      this.mock.restore();
    });

    it('should start to monitor the link once', function() {
      this.mock.expects('_startOnce').once();

      Link.fetchAll(function(err, list) {
        list.forEach(function(link) {
          crawler1.enqueue(link);
        });
      });
    });
  });

  describe('Monitoring a link', function() {
    var crawler = new Crawler();

    before(function() {
      this.spy = sinon.spy(crawler, '_startOnce');
    });

    after(function() {
      this.spy.restore();
    });

    before(function() {
      this.clock = sinon.useFakeTimers();
    });

    after(function() {
      this.clock.restore();
    });

    describe('When it keeps running', function() {
      before(function() {
        nock.disableNetConnect();
        this.scope = nock(linkOne.url)
          .get('/').times(2).reply(200, 'OK');
      });

      after(function() {
        this.scope.done();
      });

      it('should monitor the link continuously', function(done) {
        var self = this;

        Link.fetchAll(function(err, list) {
          list.forEach(function(link) {
            crawler.enqueue(link);
          });

          self.spy.calledOnce.should.be.true;
          self.clock.tick(60 * 1000);
        });

        crawler.once('end', function() {
          self.spy.calledTwice.should.be.true;

          crawler.once('end', function(link) {
            self.spy.calledThrice.should.be.true;
            done();
          });

          self.clock.tick(60 * 1000);
        });
      });
    });

    describe('Dequeue a link', function() {
      before(function() {
        this.spy.reset();
      });

      before(function() {
        nock.disableNetConnect();
        this.scope = nock(linkOne.url)
          .get('/').once().reply(200, 'OK');
      });

      after(function() {
        this.scope.done();
      });

      it('should stop the monitoring task', function(done) {
        var self = this;

        crawler.once('end', function(link) {
          self.spy.calledOnce.should.be.true;

          crawler.dequeue(link);
          crawler.queue.should.have.lengthOf(0);

          crawler.once('end', function(link) {
            self.spy.calledOnce.should.be.true;
            done();
          });

          self.clock.tick(60 * 1000);
        });

        self.clock.tick(60 * 1000);
      });
    });
  });
});
