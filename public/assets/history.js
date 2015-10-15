var BenchHisItem = React.createClass({
  render: function() {
    var item = this.props.data.value;
    var markedDate = new Date();
    var releaseDate = new Date();
    markedDate.setTime(item.markedAt);
    releaseDate.setTime(item.releaseAt);
    var releaseAt = item.releaseAt ? formatDateTime(releaseDate) : '';
    var markedAt = formatDateTime(markedDate);
    return (
      <tr>
        <td>{item.hostname}</td>
        <td>{item.ip}</td>
        <td>{markedAt}</td>
        <td>{releaseAt}</td>
      </tr>
    );
  }
});

var BenchHisList = React.createClass({
  handleSubmit: function(e) {
    e.preventDefault();
    var form = $(e.target);
    var data = "";
    var dataArray = form.serializeArray();
    dataArray.forEach(function(d) {
      var timestamp = new Date(d.value).valueOf() / 1000;
      if (d.name === 'end') {
        timestamp += 86400;
      }

      data += d.name + "=" + timestamp + "&"
    })
    data = data.substring(0, data.length - 1);
    var action = form.attr('action');
    $.ajax({
      url: action + '?' + data,
      method: 'get',
      dataType: 'json',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function() {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {
      data: []
    };
  },
  componentDidMount: function() {
    var defaultEndDate = new Date();
    var defaultStartDate = new Date(defaultEndDate.getTime() - 7 * 86400 * 1000);
    var strStartDate = formatDate(defaultStartDate);
    var strEndDate = formatDate(defaultEndDate);
    $("#hisStartDate").val(strStartDate);
    $("#hisEndDate").val(strEndDate);
    $.ajax({
      url: '/api/history?start=' + parseInt(defaultStartDate.valueOf() / 1000) + "" + '&end=' + parseInt(defaultEndDate.valueOf() / 1000) + "",
      method: 'get',
      dataType: 'json',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function() {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  render: function() {
    var data = this.state.data;
    var historys = data.map(function(h) {
      return (
        <BenchHisItem data={h}/>
      );
    });
    return (
      <div className="div-data-table table-responsive">
          <div className="div-actionbar div-his-actionbar">
            <form className="form-inline" action="/api/history" onSubmit={this.handleSubmit}>
              <div className="form-group div-group">
                <label className="div-label-his" htmlFor="start">开始时间</label>
                <input id="start" id="hisStartDate" className="form-control" type="text" name="start" />
              </div>
              <div className="form-group div-group">
                <label className="div-label-his" htmlFor="end">结束时间</label>
                <input type="text" id="hisEndDate" className="form-control" name="end" />
              </div>
              <input type="submit" className="btn btn-primary" value="查询" />
              <span>(注:时间格式为yyyy-mm-dd)</span>
            </form>
          </div>
          <table className="table-benchs table table-hover">
            <tbody>
              <tr>
                <td>主机名</td>
                <td>IP地址</td>
                <td>标记时间</td>
                <td>释放时间</td>
              </tr>
              {historys}
            </tbody>
          </table>
        </div>
    );
  }
});

var BenchHis = React.createClass({
  render: function() {
    return (
      <div>
        <div>
          <span className="span-benchs">历史记录</span>
        </div>
        <BenchHisList />
      </div>
    );
  }
});