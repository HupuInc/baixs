var express = require('express');
var SwaggerExpress = require('swagger-express-mw');
var WebSocketServer = require('websocket').server;

var Cron = require('./cron');
var openDb = require('./db');

var app = express();
app.use('/', express.static('./public'));
app.use('/assets/fonts', express.static('node_modules/bootstrap/dist/fonts'));
app.use('/assets/css/bootstrap.min.css', express.static('node_modules/bootstrap/dist/css/bootstrap.css'));
app.use('/assets/jquery.min.js', express.static('node_modules/jquery/dist/jquery.js'));
app.use('/assets/JSXTransformer.js', express.static('node_modules/react/dist/JSXTransformer.js'));
app.use('/assets/react.min.js', express.static('node_modules/react/dist/react.js'));

var db = openDb(initApp);

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function startWebsocket(httpServer) {
  var wsServer = new WebSocketServer({
      httpServer: httpServer,
      // You should not use autoAcceptConnections for production
      // applications, as it defeats all standard cross-origin protection
      // facilities built into the protocol and the browser.  You should
      // *always* verify the connection's origin and decide whether or not
      // to accept it.
      autoAcceptConnections: false
  });

  wsServer.on('request', onWebSocketConnected);

  return wsServer;
}

function onWebSocketConnected(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept('baixs-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });

  db.models.Link.fetchAll(function(err, links) {
    connection.send(
      JSON.stringify({
        id: 'link-list',
        list: links
      })
    );
  })
}

function initApp() {
  var config = {
    appRoot: __dirname // required config
  };

  app.set('models', db.models);
  console.log('Starting in env', process.env.NODE_ENV);
  SwaggerExpress.create(config, function(err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 10010;
    var hostname = process.env.HOST || '127.0.0.1';
    var httpServer = app.listen(port);

    var wsSocket = startWebsocket(httpServer);

    var cron = new Cron(db, wsSocket);
    cron.start();

    console.log('try this:\ncurl http://' + hostname + ':' + port + '/hello?name=Scott');
  });
}

module.exports = app; // for testing
