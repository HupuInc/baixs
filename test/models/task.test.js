var nock = require('nock');
var should = require('should');
var bootstrap = require('../');

var models = bootstrap.models;
var leveldb = bootstrap.leveldb;

describe('Model - Task', function() {
  var link = {
    url: 'http://www.baidu.com',
    proxy: ''
  };
  var task = new models.Task(link);

  before(function(done) {
    models.Link.create(link, done);
  });

  describe('Create a new task', function() {
    before(function(done) {
      task.save(done);
    });

    it('should contain the uuid of link', function(done) {
      task.uuid.should.startWith('task:' + models.Link.uuid(link));
      leveldb.get(task.uuid, function(err, doc) {
        should.exist(doc);
        done(err)
      });
    });

    describe('Run a task', function() {

      before(function(done) {
        nock.disableNetConnect();
        this.scopeBaidu = nock('http://www.baidu.com/').get('/').reply(201, 'OK');
        task.run(done);
      });

      after(function() {
        this.scopeBaidu.done();
      });

      it('should update status code of the link', function(done) {
        leveldb.get(task.uuid, function(err, doc) {
          should.exist(doc.endAt);
          doc.link.status.should.eql(201);
          done(err)
        });
      });
    });
  });
});
