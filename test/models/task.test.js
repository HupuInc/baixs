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

  describe('Run a task, respond with success', function() {

    before(function(done) {
      nock.disableNetConnect();
      this.scopeBaidu = nock('http://www.baidu.com/').get('/').reply(201, 'OK');
      task.run(done);
    });

    after(function() {
      this.scopeBaidu.done();
    });

    it('should update stats of the link', function() {
      should.exist(task.endAt);
      task.link.status.should.eql(201);
      task.link.count.should.eql(1);
      task.link.lastResTime.should.above(0);
      task.link.avgResTime.should.above(0);
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

    it('should return a null status', function() {
      should.exist(task.endAt);
      should(task.link.status).be.null;
    });
  });

});
