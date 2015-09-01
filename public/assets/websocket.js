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
    var attrNodes = this.props.data.map(function(hashedLink, idx) {
      return (
        <BxsLink data={hashedLink.value} index={idx + 1}/>
      );
    });
    return (
      <tbody>
      {attrNodes}
      </tbody>
    );
  }
});

var BxsLink = React.createClass({
  render: function() {
    var link = this.props.data;
    var idx = this.props.index;
    var statusClass = '';
    if (link.status >= 400) {
      statusClass = 'warning';
    }
    return (
      <tr className={statusClass}>
        <td>{idx}</td>
        <td>{link.url}</td>
        <td>{link.proxy}</td>
        <td>{link.status}</td>
        <td>{link.lastResTime}</td>
        <td>{link.avgResTime}</td>
        <td>{link.count}</td>
      </tr>
    );
  }
});

var BxsLinkForm = React.createClass({
  render: function() {
    return (
      <form method="POST" action="/api/links" onSubmit={this.props.handleSubmit}>
        URL <input type="text" name="url" />
        Proxy <input type="text" name="proxy" />
        <input type="submit" />
      </form>
    );
  }
});

var UrlTab = React.createClass({
  getInitialState: function() {
    return {data: []}
  },
  connect: function() {
    var url = 'ws://' + document.URL.substr(7).split('/')[0];
    var socket = new WebSocket(url, 'baixs-protocol');
    socket.onmessage = this.onSocketMessage;
  },
  componentDidMount: function() {
    this.connect();
  },
  onSocketMessage: function(evt) {
    var data = JSON.parse(evt.data);
    if (data.id === 'link-list') {
      // The 1st time to render the table
      this.setState({data: data.list});
    }
    else if (data.id === 'link-update') {
      this.setState({data: data.update});
    }
  },
  handleSubmit: function(evt) {
    evt.preventDefault();
    var $form = $(evt.target);
    var input = $form.serializeArray();
    var link = input.reduce(function(prev, current) {
      prev[current.name] = current.value;
      return prev;
    }, {});

    console.log('Submit a new link:', {link: link});

    $form.find('input[type=text]').val('');
    $.ajax({
      type: 'POST',
      url: $form.attr('action'),
      contentType: 'application/json',
      data: JSON.stringify(link),
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
      }.bind(this)
    })
  },
  render: function() {
    return (
    <div>
      <div id="bxs-monitor" className="container-fluid">
          <div className="row center-block">
              <div className="col-md-10 col-xs-10">
                  <button className="btn btn-primary" type="button" data-toggle="collapse" data-target="#link-form">
                      添加 <span className="glyphicon glyphicon-plus"></span>
                  </button>
              </div>
          </div>

          <div className="row center-block">
              <div className="col-md-10 col-xs-10">
              <p>
              <div id="link-form" className="collapse"><BxsLinkForm handleSubmit={this.handleSubmit}/></div>
              </p>
              </div>
          </div>

          <div id="bxs-monitor-table" className="table-responsive">
            <BxsMonitor data={this.state.data}/>
          </div>
      </div>
    </div>
    );
  }
});
