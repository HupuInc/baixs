var express = require('express');
var fs = require('fs');
var SwaggerExpress = require('swagger-express-mw');

var app = express();
app.use('/', express.static(__dirname + '/public'));
app.use('/assets/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));
app.use('/assets/css/bootstrap.min.css', express.static(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.css'));

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

app.set('models', require('./models'));

module.exports = function(done) {
  var config = { appRoot: __dirname };

  SwaggerExpress.create(config, function(err, swaggerApp) {
    if (err) {
      throw err;
    }
    swaggerApp.register(app);
    done(app);
  });
};
