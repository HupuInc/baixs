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
      <BxsLinkList {...this.props}/>
      </table>
    );
  }
});

var BxsLinkList = React.createClass({
  render: function() {
    var editable = this.props.editable;
    var handleRemove = this.props.handleRemove;
    var attrNodes = this.props.data.map(function(hashedLink, idx) {
      return (
        <BxsLink data={hashedLink} index={idx + 1} editable={editable} handleRemove={handleRemove}/>
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
  handleClick: function(evt) {
    evt.preventDefault();
    var link = this.props.data;
    this.props.handleRemove(link);
  },
  render: function() {
    var link = this.props.data.value;
    var idx = this.props.index;
    var editable = this.props.editable;
    var statusClass = '';
    if (link.status >= 400) {
      statusClass = 'warning';
    }
    var editingColumn = idx;
    if (editable) {
      editingColumn = <button className="btn btn-xs btn-danger" type="button" onClick={this.handleClick}>
          <span className="glyphicon glyphicon-minus"></span>
        </button>
    }
    return (
      <tr className={statusClass}>
        <td>{editingColumn}</td>
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

    this.props.handleSubmit($form.attr('action'), link)
  },
  render: function() {
    return (
      <form method="POST" action="/api/links" onSubmit={this.handleSubmit}>
        URL <input type="text" name="url" />
        Proxy <input type="text" name="proxy" />
        <input type="submit" />
      </form>
    );
  }
});

var UrlTab = React.createClass({
  getInitialState: function() {
    return {data: [], editable: false}
  },
  connect: function() {
    var url = 'ws://' + document.URL.substr(7).split('/')[0] + '/channel';
    this.socket = new WebSocket(url, 'baixs-protocol');
    this.socket.onmessage = this.onSocketMessage;
  },
  disconnect: function() {
    this.socket.close();
  },
  componentDidMount: function() {
    this.connect();
  },
  componentWillUnmount: function() {
    this.disconnect();
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
  handleSubmit: function(action, link) {
    $.ajax({
      type: 'POST',
      url: action,
      contentType: 'application/json',
      data: JSON.stringify(link),
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
      }.bind(this)
    });
  },
  handleRemove: function(link) {
    var answer = window.confirm('确定要删除 ' + link.value.url + ' 这个监控？');

    if(answer) {
      $.ajax({
        type: 'DELETE',
        url: '/api/links/' + link.key,
        dataType: 'json',
        success: function(data) {
          this.setState({data: data});
        }.bind(this)
      });
    }
  },
  handleEdit: function(evt) {
    var editable = this.state.editable;
    this.setState({editable: !editable});
    $(evt.currentTarget).children('span.glyphicon').toggleClass('glyphicon-pencil').toggleClass('glyphicon-log-out');
  },
  render: function() {
    return (
    <div>
      <div id="bxs-monitor" className="container-fluid">
          <div className="row center-block">
              <div className="col-md-1 col-xs-1">
                  <button className="btn btn-primary" type="button" data-toggle="collapse" data-target="#link-form">
                      添加 <span className="glyphicon glyphicon-plus"></span>
                  </button>
              </div>
              <div className="col-md-1 col-xs-1">
                  <button className="btn btn-primary" type="button" onClick={this.handleEdit}>
                      编辑 <span className="glyphicon glyphicon-pencil"></span>
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
            <BxsMonitor data={this.state.data} editable={this.state.editable} handleRemove={this.handleRemove}/>
          </div>
      </div>
    </div>
    );
  }
});
