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

    describe('Run a task, respond with success', function() {

      before(function(done) {
        nock.disableNetConnect();
        this.scopeBaidu = nock('http://www.baidu.com/').get('/').reply(201, 'OK');
        task.run(done);
      });

      after(function() {
        this.scopeBaidu.done();
      });

      it('should update stats of the link', function(done) {
        leveldb.get(task.uuid, function(err, doc) {
          should.exist(doc.endAt);
          doc.link.status.should.eql(201);
          doc.link.count.should.eql(1);
          doc.link.lastResTime.should.above(0);
          doc.link.avgResTime.should.above(0);
          done(err);
        });
      });
    });

    describe('Run a task, respond with timeout', function() {

      before(function(done) {
        nock.disableNetConnect();
        this.scopeBaidu = nock('http://www.baidu.com/')
                            .get('/')
                            .socketDelay(60000)
                            .reply(500, 'OK');
        task.run(done);
      });

      after(function() {
        this.scopeBaidu.done();
      });

      it('should return a null status', function(done) {
        leveldb.get(task.uuid, function(err, doc) {
          should.exist(doc.endAt);
          should(doc.link.status).be.null;
          done(err);
        });
      });
    });
  });
});
