
function handleWebsocketMessage() {
  console.log('A message has arrived');
}

function handleWebsocketClose() {
  console.log('Websocket is closed');
}

function connect() {
  var url = 'ws://' + document.URL.substr(7).split('/')[0];
  var socket = new WebSocket(url, 'baixs-protocol');
  socket.onmessage = handleWebsocketMessage.bind(this);
  socket.onclose = handleWebsocketClose.bind(this);
}

connect();
