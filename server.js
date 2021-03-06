var url = require('url');
var WebSocketServer = require('websocket').server;
var _ = require('lodash');

var initApp = require('./app');
var Alert = require('./lib/alert');
var Crawler = require('./lib/crawler');
var Porter = require('./lib/porter');

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function startWebsocket(httpServer, models) {

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

    models.Link.fetchAll(function(err, links) {
      connection.send(
        JSON.stringify({
          id: 'link-list',
          list: links,
        })
      );
    });

    models.Monitor.fetchCurrentEvent(function(err, events) {
      connection.send(
        JSON.stringify({
          id: 'event-list',
          list: events,
        })
      );
    });
  }

  var wsServer = new WebSocketServer({
      httpServer: httpServer,
      // You should not use autoAcceptConnections for production
      // applications, as it defeats all standard cross-origin protection
      // facilities built into the protocol and the browser.  You should
      // *always* verify the connection's origin and decide whether or not
      // to accept it.
      autoAcceptConnections: false,
  });

  wsServer.on('request', onWebSocketConnected);

  return wsServer;
}

function setupCrawler(app, wsSocket) {
  var crawler = app.get('crawler');
  var models = app.get('models');

  crawler.enqueue(new models.Monitor());

  crawler.on('change', function(status, link) {
    // send alert to Zabbix
    var urlObj = url.parse(link.doc.proxy || link.doc.url);
    var ip = urlObj.hostname;

    models.Host.fetchByIp(ip, function(err, host) {
      if (err) {
        console.error(err.toString());
      }
      else {
        var msg = ''; // no errors;
        if (status === 0) {
          // when error occurrs, send monitoring url
          msg = link.doc.url
        }
        Alert.send(host.hostname, msg);
      }
    });
  });

  crawler.on('end', function(id, object) {
    var socketId = id === 'events' ? 'event-update' : 'link-update';
    wsSocket.broadcast(
      JSON.stringify({
        id: socketId,
        update: object,
      })
    );
  });
}

function setupPorter(app) {
  var crawler = app.get('crawler');
  var porter = app.get('porter');
  var models = app.get('models');
  var Link = models.Link;
  porter.on('change', function(changes) {
    // get rid of removed links
    var ids = _.pluck(changes, 'id');
    var removed = _.filter(Link.fetchAll(), function(link) {
      return ids.indexOf(link.id) == -1;
    });
    var added = _.filter(changes, Link.update);

    removed.forEach(function(link) {
      crawler.dequeue(link);
      link.del();
    });

    added.forEach(function(link) {
      crawler.enqueue(link);
    });

  });
  porter.run();
}

var port = process.env.PORT || 10010;
var hostname = process.env.HOST || '127.0.0.1';

initApp(function(app) {
  console.log('Starting in env', app.get('env'));
  var httpServer = app.listen(port, hostname);
  var wsSocket = startWebsocket(httpServer, app.get('models'));
  var crawler = new Crawler();
  var porter = new Porter();
  app.set('crawler', crawler);
  app.set('porter', porter);
  setupPorter(app);
  setupCrawler(app, wsSocket);
});

console.log('try this:\ncurl http://' + hostname + ':' + port + '/hello?name=Scott');
