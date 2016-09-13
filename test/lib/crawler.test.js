var nock = require('nock');
var should = require('should');
var sinon = require('sinon');
var Crawler = require('../../lib/crawler');
var fixture = require('../fixture');

var models = require('../').models;
var Host = models.Host;
var Link = models.Link;
var linkOne = fixture.linkOne;
var linkTwo = fixture.linkTwo;

describe('Crawler', function() {
  before(function() {
    Link.update(new Host(linkOne));
  });

  after(function() {
    Link.clearAll();
  });

  describe('Enqueue or Dequeue a link', function() {
    var crawler1 = new Crawler();
    var thirdLink = new Link({
      url: 'http://www.baidu.com',
    });

    before(function() {
      Link.update(new Host(linkTwo));
    });

    before(function() {
      this.mock = sinon.mock(crawler1, '_startOnce');
    });

    after(function() {
      this.mock.restore();
    });

    it('should start to monitor the link once', function() {
      this.mock.expects('_startOnce').twice();

      var list = Link.fetchAll();
      list.forEach(function(link) {
        crawler1.enqueue(link);
      });
    });

    it('should dequeue the third link', function() {
      crawler1.queue.unshift(thirdLink.id);
      crawler1.queue.should.have.lengthOf(3);
      crawler1.dequeue(thirdLink).should.be.true;
      crawler1.queue.should.have.lengthOf(2);
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

    before(function() {
      nock.disableNetConnect();
      this.linkOne = new Link({
        url: 'http://www.baidu.com',
      });
      this.scope = nock(this.linkOne.doc.url)
        .get('/').times(2).reply(200, 'OK');
    });

    after(function() {
      this.scope.done();
    });

    describe('When it keeps running', function() {

      it('should monitor the link continuously', function(done) {
        var self = this;
        crawler.enqueue(this.linkOne);
        self.spy.calledOnce.should.be.true;
        self.clock.tick(60 * 1000);

        crawler.once('end', function() {
          self.spy.calledTwice.should.be.true;
          crawler.once('end', function() {
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

      it('should stop the monitoring task', function(done) {
        var self = this;

        crawler.once('end', function(id, link) {
          self.spy.calledOnce.should.be.true;
          should.exist(link);

          crawler.dequeue(link);
          crawler.queue.should.have.lengthOf(0);

          crawler.once('end', function(id, link) {
            self.spy.calledOnce.should.be.true;
            should(link).be.empty;
            done();
          });

          self.clock.tick(60 * 1000);
        });

        self.clock.tick(60 * 1000);
      });
    });
  });
});
