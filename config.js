var _ = require('lodash');

var defaultConfig = {
  database: {
    backend: 'leveldown',
    file: __dirname + '/data/baixs.db'
  },
};

var config = {
  development: function() {
    return _.merge(defaultConfig, {
      database: {
      },
    });
  },

  test: function() {
    return _.merge(defaultConfig,{
      database:{
        backend: 'memdown'
      }
    });
  },

  production: function() {
    return _.merge(defaultConfig, {
      // production environment config
      database: {
      },
    });
  }
};

var env = process.env.NODE_ENV || 'development';

module.exports = config[env]();
