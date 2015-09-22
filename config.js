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
  zabbix: {
    url: 'http://al.zabbix.hupu.com/api_jsonrpc.php',
    user: 'admin',
    password: '',
  },
};

var config = {
  development: function() {
    return _.merge(defaultConfig, {
      database: {
      },
      etcd: {
      },
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
      },
      zabbix: {
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
      zabbix: {
      }
    });
  }
};

var env = process.env.NODE_ENV || 'development';

module.exports = config[env]();
