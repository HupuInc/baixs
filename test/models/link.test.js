var net = require('net');
var nock = require('nock');
require('should');
var sinon = require('sinon');
var _ = require('lodash');
var bootstrap = require('../');

var models = bootstrap.models;
var leveldb = bootstrap.leveldb;
var Link = models.Link;

var fixtures = {
  links: [
    {
      url: 'http://www.hupu.com',
      proxy: '127.0.0.1:8080',
      description: 'Homepage of hupu.com',
      status: 200,
    },
    {
      url: 'http://nba.hupu.com/test',
      description: 'NBA portal of hupu.com',
      status: 404,
    },
  ],
};

describe('Model - Link', function() {
  var linkDoc = fixtures.links[0];

  before(function(done) {
    var batch = leveldb.batch();
    fixtures.links.forEach(function(link) {
      batch.put(Link.uuid(link), link, { valueEncoding: 'json' });
    });

    batch.write(done);
  });

  after(function() {
    Link.clearAll();
  });

  it('should contain the record', function(done) {
    var id = models.Link.uuid(linkDoc);
    leveldb.get(id, function(err, doc) {
      if (err) {
        done(err);
      } else {
        doc.should.be.eql(linkDoc);
        done();
      }
    });
  });

  describe('Update a link status', function() {
    var doc = _.clone(linkDoc);
    doc.status = 404;
    var link = new models.Link(doc);

    before(function() {
      link.save();
    });

    it('should update successfully', function() {
      var id = models.Link.uuid(linkDoc);
      var linkUnderTest = Link.fetch(id);
      linkUnderTest.doc.status.should.eql(404);
    });
  });

  describe('Monitor a http link', function() {

    var doc = {
      url: 'http://www.baidu.com',
      proxy: '',
    };
    var link = new Link(doc);

    before(function() {
      link.save();
    });

    before(function() {
      this.clock = sinon.useFakeTimers();
    });

    after(function() {
      this.clock.restore();
    });

    describe('When respond with success', function() {
      before(function() {
        nock.disableNetConnect();
        this.scope = nock('http://www.baidu.com/')
          .get('/').reply(201, 'OK');
      });

      after(function() {
        this.scope.done();
      });

      it('should update stats of the link', function(done) {
        link.once('end', function() {
          var theLink = link.doc;
          theLink.status.should.eql(201);
          theLink.count.should.eql(1);
          theLink.lastResTime.should.above(0);
          theLink.avgResTime.should.above(0);
          done();
        });

        link.start();
        var clock = this.clock;
        setTimeout(function() {
          clock.tick(60 * 1000);
        }, 1);
        clock.tick(1);
      });
    });

    describe('When respond with timeout',function() {

      before(function() {
        nock.disableNetConnect();
        this.scope = nock('http://www.baidu.com/')
                            .get('/')
                            .socketDelay(60000)
                            .reply(500, 'OK');
      });

      after(function() {
        this.scope.done();
      });

      it('should return a status with code 600', function(done) {
        link.once('end', function(theLink) {
          var doc = theLink.doc;
          doc.status.should.eql(600);
          done();
        });

        link.start();
        this.clock.tick(60 * 1000);
      });
    });
  });

  describe('Monitor a tcp link', function() {
    var port = 4231;
    var host = 'localhost';
    var doc = {
      url: 'tcp://' + host + ':' + port,
      proxy: '',
    };
    var link = new Link(doc);

    before(function() {
      link.save();
    });

    before(function() {
      this.clock = sinon.useFakeTimers();
    });

    after(function() {
      this.clock.restore();
    });

    describe('When respond successfully', function() {
      before(function(done) {
        var server = net.createServer(function(socket) {
          socket.end('Bye\n');
        }).listen(port, host, done);
        this.server = server;
      });

      after(function(done) {
        this.server.close(done);
      });

      it('should update stats of the link', function(done) {
        link.once('end', function() {
          var doc = link.doc;
          doc.status.should.eql(200);
          doc.count.should.eql(1);
          doc.lastResTime.should.above(0);
          doc.avgResTime.should.above(0);
          done();
        });

        link.start();
        var clock = this.clock;
        setTimeout(function() {
          clock.tick(60 * 1000);
        }, 1);
        clock.tick(1);
      });
    });

    describe('When respond with failure', function() {
      it('should set failed status of link', function(done) {
          link.once('end', function(theLink) {
            var doc = theLink.doc;
            doc.status.should.eql(600);
            done();
          });

          link.start();
          this.clock.tick(60 * 1000);
      });
    });
  });
});
