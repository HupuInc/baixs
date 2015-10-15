var _ = require('lodash');

var defaultConfig = {
  database: {
    backend: 'leveldown',
    file: __dirname + '/data/baixs.db'
  },
  etcd: {
    host: 'localhost',
    port: '4001',
  },
  zabbix: {
    url: '',
    user: '',
    password: '',
  },
};

var config = {
  development: function() {
    return _.merge(defaultConfig, {
      zabbix: {
        url: 'http://192.168.8.225/zabbix/api_jsonrpc.php',
        user: 'Admin',
        password: 'zabbix',
      },
    });
  },

  test: function() {
    return _.merge(defaultConfig,{
      database:{
        backend: 'memdown'
      },
      etcd: {
        host: 'localhost',
        port: 4001
      },
    });
  },

  production: function() {
    return _.merge(defaultConfig, require('./config.production.js'));
  }
};

var env = process.env.NODE_ENV || 'development';

module.exports = config[env]();
