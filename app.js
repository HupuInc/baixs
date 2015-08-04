var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
module.exports = app; // for testing
var Cron = require('./cron')

var openDb = require('./db');
var db = openDb(function() {

  var cron = new Cron(db.models);
  cron.start();

  var config = {
    appRoot: __dirname // required config
  };

  app.set('models', db.models);

  SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 10010;
    app.listen(port);

    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  });

});
