
var BxsMonitor = React.createClass({
  render: function() {
   return (
      <table className="table table-striped">
      <thead>
          <tr>
              <th>#</th>
              <th>URL</th>
              <th>Proxy</th>
              <th>状态码</th>
              <th>最近一次请求耗时（毫秒）</th>
              <th>平均请求耗时</th>
              <th>总请求次数</th>
          </tr>
      </thead>
      <BxsLinkList data={this.props.data}/>
      </table>
    );
  }
});

var BxsLinkList = React.createClass({
  render: function() {
    var attrNodes = this.props.data.map(function(link, idx) {
      var statusClass = '';
      if (link.status >= 300) {
        statusClass = 'warning'
      }

      return (
        <tr className={statusClass}>
          <td>{idx + 1}</td>
          <td>{link.url}</td>
          <td>{link.proxy}</td>
          <td>{link.status}</td>
          <td>{link.lastResTime}</td>
          <td>{link.avgResTime}</td>
          <td>{link.count}</td>
        </tr>
        );
    });
    return (
      <tbody>
      {attrNodes}
      </tbody>
    );
  }
});

function handleWebsocketMessage(evt) {
  var data = JSON.parse(evt.data);
  console.log('data arrived:', data.id);
  if (data.id == 'link-list') {
    // To start the render process
    React.render(
      <BxsMonitor data={data.list}/>,
      document.getElementById('bxs-monitor')
    );
  }
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

// To start the data pipeline
connect();
