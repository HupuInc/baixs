require('should');
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
});
