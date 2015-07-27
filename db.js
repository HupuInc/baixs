var levelup = require('levelup');
var dbConfig = require('./config').database;
var initModels = require('./models');

module.exports = function open(done) {
  var leveldb = levelup(
    dbConfig.file,
    {
      db: require(dbConfig.backend),
      valueEncoding: 'json'
    }
  );

  leveldb.on('ready', function() {
    done();
  });

  return {
    models: initModels(leveldb),
    instance: leveldb,
  };
};
