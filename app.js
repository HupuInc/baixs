var express = require('express');
var fs = require('fs');
var SwaggerExpress = require('swagger-express-mw');

var app = express();
app.use('/', express.static(__dirname + '/public'));
app.use('/assets/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));
app.use('/assets/css/bootstrap.min.css', express.static(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.css'));
app.use('/assets/jquery.min.js', express.static(__dirname + '/node_modules/jquery/dist/jquery.js'));
app.use('/assets/bootstrap.min.js', express.static(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js'));
app.use('/assets/JSXTransformer.js', express.static(__dirname + '/node_modules/react/dist/JSXTransformer.js'));
app.use('/assets/react.min.js', express.static(__dirname + '/node_modules/react/dist/react.js'));

app.get('/version', function(req, res) {
  fs.readFile(__dirname + '/version', function(err, data) {
    if (err) {
      res.status(400).send(err.toString());
    } else {
      res.set('Content-Type', 'text/plain')
        .status(200)
        .send(data);
    }
  });
});

var openDb = require('./db');

module.exports = function(done) {
  var db = openDb(function() {
    var config = {
      appRoot: __dirname // required config
    };

    app.set('db', db);
    app.set('models', db.models);
    SwaggerExpress.create(config, function(err, swaggerApp) {
      if (err) {
        throw err;
      }
      // install middleware
      swaggerApp.register(app);

      done(app);
    });
  });
};
