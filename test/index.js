var openDb = require('../db');
var db = openDb(function() {});

exports.models = db.models;
exports.leveldb = db.instance;
