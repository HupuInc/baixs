var _ = require('lodash');

var defaultConfig = {
  database: {
    backend: 'leveldown',
    file: __dirname + '/data/baixs.db'
  },
  etcd: {
    host: 'racktables.hupu.com',
    port: '4001',
  },
};

var config = {
  development: function() {
    return _.merge(defaultConfig, {
      database: {
      },
      etcd: {
      },
    });
  },

  test: function() {
    return _.merge(defaultConfig,{
      database:{
        backend: 'memdown'
      },
      etcd: {
      },
    });
  },

  production: function() {
    return _.merge(defaultConfig, {
      // production environment config
      database: {
      },
      etcd: {
      },
    });
  }
};

var env = process.env.NODE_ENV || 'development';

module.exports = config[env]();
