require('should');
var _ = require('lodash');
var bootstrap = require('../');

var models = bootstrap.models;
var leveldb = bootstrap.leveldb;

var fixtrues = {
  link: {
    url: 'http://www.hupu.com',
    proxy: '127.0.0.1:8080',
    description: 'Homepage of hupu.com',
    status: 200,
  }
};

describe('Model - Link', function() {
  before(function(done) {
    models.Link.create(fixtrues.link, done);
  });

  it('should contain the record', function(done) {
    var id = models.Link.uuid(fixtrues.link);
    leveldb.get(id, function(err, doc) {
      if (err) {
        done(err);
      } else {
        doc.should.be.eql(fixtrues.link);
        done();
      }
    })
  });

  describe('Update a link status', function() {
    var link = _.clone(fixtrues.link);

    before(function(done) {
      link.status = 404;
      models.Link.update(link, done)
    });

    it('should update successfully', function(done) {
      var id = models.Link.uuid(fixtrues.link);
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
