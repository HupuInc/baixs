var util = require('util');

// NS is used as the key of each host
// e.g.
//     host 192.168.1.1 has a host name kq-web-1-1-prd.jh
//     'host:192.168.1.1' will be the key for all the info stored in leveldb
//     'host:kq-web-1-1-prd.jh' will return 192.168.1.1
var NS = 'host:%s';

function mountWithProperties(obj) {
  var properties = ['hostname', 'ip', 'has_problems'];

  properties.forEach(function(prop) {
    Object.defineProperty(obj, prop, {
      get: function() {
        return obj.doc[prop];
      },
      enumerable: true,
    });
  });
}

// A host contains attributes
//   - required: id, doc.hostname, doc.ip, doc.has_problems(default to no)
//   - optional: doc.mac, doc.parent, doc.domains
//   doc.domains is an array of domain, which contains attributes
//     - name, uuid, ip, mac
function Host(doc) {
  this.doc = doc;
  this.id = util.format(NS, doc.ip);
  mountWithProperties(this);
}

Host.dummy = {
  has_problems: 'no',
};

Host.fetch = function(key, done) {
  Host.leveldb.get(key, function(err, doc) {
    if (err) {
      done(err);
    }
    else {
      done(null, new Host(doc));
    }
  });
};

Host.fetchByIp = function(ip, done) {
  Host.fetch(util.format(NS, ip), done);
};


Host.fetchByName = function(name, done) {
  Host.leveldb.get(util.format(NS, name), function(err, ip) {
    if (err) {
      done(err);
    }
    else {
      Host.fetch(util.format(NS, ip), done);
    }
  });
};

Host.prototype.save = function(done) {
  Host.leveldb
    .batch()
    .put(this.id, this.doc, { valueEncoding: 'json' })
    .put(util.format(NS, this.doc.hostname), this.doc.ip)
    .write(done);
};

module.exports = Host;
