var nock = require('nock');
var should = require('should');
var bootstrap = require('../');
var fixture = require('../fixture');
var moment = require('moment');

var models = bootstrap.models;
var Hostvars = models.Hostvars;

describe('Model - Hostvars', function() {

  var hostOne = fixture.hostOne;
  var hostTwo = fixture.hostTwo;
  var vmmOne = fixture.vmmOne;
  var vmHostOne = fixture.vmHostOne;
  var vmHostTwo = fixture.vmHostTwo;
  var vmHostThree = fixture.vmHostThree;

  var mockedHostvars= {
    'node': {
      'key': '/hostvars',
      'dir': true,
      nodes: [ hostOne, hostTwo ],
    },
    'modifiedIndex': 3,
    'createdIndex': 3,
    'action': 'get',
  };

  var mockedResponse = {
    'node': {
      'key': '/hostvars',
      'dir': true,
      'nodes': [ vmmOne, vmHostOne, vmHostTwo, vmHostThree ],
    },
    'modifiedIndex': 3,
    'createdIndex': 3,
    'action': 'get',
  };

  describe('Get a single host', function() {
    before(function() {
      nock.disableNetConnect();
      this.scope = nock('http://localhost:4001/')
        .get('/v2/keys/hostvars/')
        .query({ recursive: true })
        .reply(200, mockedHostvars);
    });

    after(function() {
      this.scope.done();
    });

    it('should return one host', function(done) {
      Hostvars.get('/hostvars/', { recursive: true }, function(err, body) {
        should.not.exist(err);
        body.node.nodes.should.containEql(hostOne);
        done();
      });
    });
  });

  describe('Fetch all the hosts which have problems', function() {

    before(function() {
      nock.disableNetConnect();
      this.scope = nock('http://localhost:4001/')
        .get('/v2/keys/hostvars/')
        .query({ recursive: true })
        .reply(200, mockedHostvars);
    });

    after(function() {
      this.scope.done();
    });

    it('should return a list of hosts', function(done) {
      Hostvars.fetchHasProblems(function(hosts) {
        hosts.should.have.lengthOf(1);
        var theHost = hosts[0];
        theHost.should.have.properties('hostname', 'ip');
        done();
      });
    });
  });

  describe('Fetch all the vmm hosts', function() {
    before(function() {
      nock.disableNetConnect();
      this.scope = nock('http://localhost:4001/')
        .get('/v2/keys/hostvars/')
        .query({ recursive: true })
        .reply(200, mockedResponse);
    });

    after(function() {
      this.scope.done();
    });

    it('should return a list of vmm hosts', function(done) {
      Hostvars.fetchVmmHost(function(list) {
        list.should.be.instanceof(Array);
        var vmHost = list[0];
        vmHost.should.have.property('domain').with.lengthOf(3);
        done();
      });
    });
  });

  describe('Counter vm hosts', function() {
    var yesterday = moment(moment().subtract(1, 'days').toArray().slice(0, 3)).valueOf();
    var counterId = 'vmcounter:' + yesterday;

    before(function() {
      nock.disableNetConnect();
      this.scope = nock('http://localhost:4001/')
        .get('/v2/keys/hostvars/')
        .query({ recursive: true })
        .reply(200, mockedResponse);
    });

    after(function() {
      this.scope.done();
    });

    it('should create the counter key', function(done) {
      Hostvars.vmCounter(function(err) {
        should.not.exist(err);
        Hostvars.leveldb.get(counterId, function(err, value) {
          should.not.exist(err);
          value.should.equal(3);
          done();
        });
      });
    });
  });
});
