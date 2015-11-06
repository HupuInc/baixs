var nock = require('nock');
var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

var bootstrap = require('../');
var models = bootstrap.models;
var Host = models.Host;
var Porter = require('../../lib/porter');

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

  describe('When hosts are fetched from etcd', function() {
    before(function() {
      nock.disableNetConnect();
      this.scope = nock('http://localhost:4001/')
        .get('/v2/keys/hostvars/')
        .query({ recursive: true })
        .twice()
        .reply(200, mockedResponse);
    });

    after(function() {
      this.scope.done();
    });

    it('will tranform response into a list of Host', function(done) {
      var porter = new Porter();
      porter.fetchFromSource(function(err, hosts) {
        hosts.should.be.an.Array;
        hosts.should.have.lengthOf(mockedNodes.length);
        hosts.forEach(function(host) {
          host.should.be.an.instanceOf(Host);
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

        done(err);
      });
    });

    describe('Fetch from source every 30 seconds', function() {
      var porter = new Porter();

      before(function() {
        this.clock = sinon.useFakeTimers();
      });

      after(function() {
        this.clock.restore();
      });

      before(function() {
        this.stub = sinon.stub(porter, 'fetchFromSource');
        this.stub.yields(null, []);
      });

      after(function() {
        this.stub.restore();
      });

      it('will save the results into db', function(done) {
        var theStub = this.stub;
        var clock = this.clock;

        porter.on('error', done);

        porter.once('change', function() {
          theStub.calledOnce.should.be.true;
          theStub.restore();

          porter.once('change', function() {
            // hostOne: 192.168.1.1
            Host.fetch('host:192.168.1.1', function(err, host) {
              host.should.be.an.instanceOf(Host);
              done(err);
            });
          });

          clock.tick(Porter.INTERVAL);
        });

        porter.start();
        clock.tick(Porter.INTERVAL);
      });
    });
  });

  describe('When send a invalidate signal', function() {
    it('will fetch hosts from etcd immediately');
  });

});
