var nock = require('nock');
var should = require('should');
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
  ]
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

  after(function(done) {
    var batch = leveldb.batch();
    fixtures.links.forEach(function(link) {
      batch.del(Link.uuid(link));
    });

    batch.write(done);
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
    })
  });

  describe('Update a link status', function() {
    var doc = _.clone(linkDoc);
    doc.status = 404;
    var link = new models.Link(doc);

    before(function(done) {
      link.save(done);
    });

    it('should update successfully', function(done) {
      var id = models.Link.uuid(linkDoc);
      leveldb.get(id, function(err, doc) {
        if (err) {
          done(err);
        } else {
          doc.status.should.eql(404);
          done();
        }
      });
    });
  });

  describe('Monitor a link', function() {

    var doc = {
      url: 'http://www.baidu.com',
      proxy: ''
    };
    var link = new Link(doc);

    before(function(done) {
      link.save(done);
    });

    before(function() {
      this.clock = sinon.useFakeTimers();
    });

    after(function() {
      this.clock.restore();
    });

    describe('When respond with success',function() {
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
          Link.fetch(link.id, function(err, theLink) {
            should.not.exist(err);
            theLink.status.should.eql(201);
            theLink.count.should.eql(1);
            theLink.lastResTime.should.above(0);
            theLink.avgResTime.should.above(0);
          });

          done();
        });
        link.start();
        this.clock.tick(60 * 1000);
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

      it('should return a null status', function(done) {
        link.once('end', function(theLink) {
          var doc = theLink.doc;
          should(doc.status).be.null;
          done();
        });
        link.start();
        this.clock.tick(60 * 1000);
      });
    });
  });
});
