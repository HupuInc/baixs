var nock = require('nock');
var should = require('should');
var _ = require('lodash');

var bootstrap = require('../');
var models = bootstrap.models;
var Host = models.Host;

var Porter = require('../../lib/porter');
var porter = new Porter();

var fixture = require('../fixture');
var hostOne = fixture.hostOne;
var vmmOne = fixture.vmmOne;
var vmHostOne = fixture.vmHostOne;
var vmHostTwo = fixture.vmHostTwo;
var vmHostThree = fixture.vmHostThree;

var mockedNodes = [ hostOne, vmmOne, vmHostOne, vmHostTwo, vmHostThree ];
var mockedResponse = {
  'node': {
    'key': '/hostvars',
    'dir': true,
    'nodes': mockedNodes,
  },
  'modifiedIndex': 3,
  'createdIndex': 3,
  'action': 'get',
};

describe('Porter', function() {
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

  describe('When hosts are fetched from etcd', function() {
    it('will tranform response into a list of Host', function(done) {
      porter.fetchFromSource(function(err, hosts) {
        should.not.exist(err);

        hosts.should.be.an.Array;
        hosts.should.have.lengthOf(mockedNodes.length);
        hosts.forEach(function(host) {
          host.should.be.an.instanceof(Host);
          host.should.have.properties('id', 'doc');
        });

        var docs = _.pluck(hosts, 'doc');
        docs.forEach(function(doc) {
          doc.should.have.properties('ip', 'hostname', 'has_problems');
        });

        // hostOne: 192.168.1.1
        should.exist(_.find(hosts, function(host) {
          return host.ip === '192.168.1.1';
        }));

        done();
      });
    });

    it('will fetch from etcd automatically every 30 seconds');
  });

  describe('When send a invalidate signal', function() {
    it('will fetch hosts from etcd immediately');
  });

});
