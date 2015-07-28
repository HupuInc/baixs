require('should');
var bootstrap = require('../');
var models = bootstrap.models;

describe('Model - Task', function() {
  describe('Create a new task', function() {
    var link = {
      url: 'http://www.baidu.com',
      proxy: '192.168.1.1'
    };

    it('should contain the uuid of link', function() {
      var task = new models.Task(link);
      task.key.should.startWith('task\0' + models.Link.uuid(link));
    });
  })
});
