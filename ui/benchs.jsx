var $ = require('jquery');
var React = require('react');
var moment = require('moment');

var BenchMarkForm = React.createClass({
  handleSubmit: function(ev) {
    ev.preventDefault();
    var input = $(ev.target).serializeArray();
    var bench = input.reduce(function(prev, current) {
      prev[current.name] = current.value;
      return prev;
    }, {});
    console.log(bench);
    var answer = window.confirm('确定要换下这台主机(' + bench.ip + ')吗？');
    if (answer) {
      this.props.handleSubmit(bench);
    }
  },
  render: function() {
    return (
      <form action="/api/benchs" method="put" acceptCharset="utf-8" className="bench-mark-form form-remote" onSubmit={this.handleSubmit}>
        <input className="bench-mark-form-input-t bench-mark-form-input" type="text" name="ip" placeholder="IP地址" />
      </form>
    );
  }
});

var BenchItem = React.createClass({
  handleCheck: function(ev) {
    this.props.handleCheck(ev, this.props.data);
  },
  render: function() {
    var item = this.props.data.data;
    var releaseAt = item.releaseAt ? moment.unix(item.releaseAt / 1000).format("YYYY-MM-DD HH:mm:ss") : '';
    var markedAt = moment.unix(item.markedAt / 1000).format("YYYY-MM-DD HH:mm:ss");

    return (
      <tr>
        <td>
          <div className="checkbox">
            <label>
              <input type="checkbox" onClick={this.handleCheck}/>
            </label>
          </div>
        </td>
        <td>{item.hostname}</td>
        <td>{item.ip}</td>
        <td>{markedAt}</td>
      </tr>
    );
  }
});

var EventItem = React.createClass({
  handleCheck: function(ev) {
    ev.preventDefault();
    var ip = this.props.data.hosts[0].ip;
    var bench = {
      ip: ip
    };
    var answer = window.confirm('确定要换下这台主机(' + ip + ')吗？');
    if (answer) {
      $('#' + this.props.data.triggerid).html('');
      $('#' + this.props.data.triggerid).prev().html('yes');
      this.props.handleSubmit(bench);
    }
  },
  render: function() {
    var item = this.props.data;
    var markedIcon = '';
    var hasProblem = item.hosts[0].maintenance_status === '0' ? 'no' : 'yes';
    var priority = '';
    var priorityClassName = 'td-prioriy ';
    if (item.hosts[0].maintenance_status === '0') {
      markedIcon = <a className="a-wrench" onClick={this.handleCheck}>
            <i className="fa fa-wrench"> </i>
          </a>
    }

    switch(item.priority) {
      case "0":
        priority = '未定义';
        priorityClassName += 'td-prioriy-classified';
        break;
      case "1":
        priority = '信息';
        priorityClassName += 'td-prioriy-info';
        break;
      case "2":
        priority = '警告';
        priorityClassName += 'td-prioriy-warning';
        break;
      case "3":
        priority = '普通';
        priorityClassName += 'td-prioriy-average';
        break;
      case "4":
        priority = '重要';
        priorityClassName += 'td-prioriy-high';
        break;
      case "5":
        priority = '灾难';
        priorityClassName += 'td-prioriy-disaster';
        break;
    }

    var age = moment.unix(item.lastchange).fromNow();

    return (
      <tr>
        <td className={priorityClassName}>{priority}</td>
        <td>{item.hosts[0].host}</td>
        <td>{item.hosts[0].ip}</td>
        <td>{item.description}</td>
        <td>{age}</td>
        <td>{hasProblem}</td>
        <td id={item.triggerid}>{markedIcon}</td>
      </tr>
    );
  }
});

var AlertList = React.createClass({
  getInitialState: function() {
    return {
      data: [],
    };
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/events',
      dataType: 'json',
      method: 'get',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  render: function() {
    var item = this.state.data;
    var self = this;
    var events = item.map(function(event) {
      return (
        <EventItem data={event} handleSubmit={self.props.handleSubmit}/>
      );
    });
    var length = item.length;
    return (
      <div className="div-data-table table-responsive">
        <table className="table-benchs table table-hover">
            <tbody>
              <tr>
                <td>告警级别</td>
                <td>主机名</td>
                <td>IP地址</td>
                <td>详细信息</td>
                <td>持续时间</td>
                <td>维护状态</td>
                <td> </td>
              </tr>
              {events}
            </tbody>
          </table>
      </div>
    );
  }
});

var BenchList = React.createClass({
  handleMarkHost: function() {
    $('.bench-mark-form-input-t').val('');
    if($(".bench-mark-form-input-t").css('display') == 'none') {
      $(".bench-mark-form-input-t").show();
      $(".bench-mark-form-input-t").animate({"width": "+=140px"}, 200);
      $(".bench-mark-form-input-t").focus();
    }
    else {
      $(".bench-mark-form-input-t").animate({"width": "-=140px"}, 200, function() {
        $('.bench-mark-form-input-t').hide();
      });
    }
  },
  handleCheck: function(ev, bench) {
    var self = this;
    function allChecked() {
      var benchs = [];
      self.state.data.map(function(bench) {
        benchs.push(bench.data);
      });
      return benchs;
    }

    function filter(obj) {
      if (obj.ip === bench.data.ip && obj.hostname === bench.data.hostname) {
        return false;
      }
      else {
        return true;
      }
    }

    var id = $(ev.target).attr('id');
    var checkeds = [];
    var backgroundColor = $(ev.target).prop('checked') === true ? "#f5f5f5" : "white";
    if (id) {
      $(".table-benchs input[type='checkbox']").prop("checked", $(ev.target).prop('checked'));
      $(".table-benchs input[type='checkbox']").each(function(index) {
        $(this).parent().parent().parent().parent().css("background-color", backgroundColor);
      });
    }
    else {
      $(ev.target).parent().parent().parent().parent().css("background-color", backgroundColor);
    }

    if ($(ev.target).prop('checked') === true && id) {
      checkeds = allChecked();
    }
    else if ($(ev.target).prop('checked') === true) {
      checkeds = this.state.checkeds;
      checkeds.push(bench.data);
    }
    else if (!id) {
      checkeds = this.state.checkeds;
      checkeds = checkeds.filter(filter);
    }

    this.setState({
      checkeds: checkeds
    });
    var checkedInputs = $(".table-benchs input:checked");
    if (checkedInputs.length > 0) {
      $(".div-row-selected").show();
      $(".div-row-action").hide();
      $(".span-selected").html($("#inputAllCheck").prop('checked') === true ? checkedInputs.length - 1 + " 项已选中" : checkedInputs.length + " 项已选中");
    }
    else {
      $(".div-row-selected").hide();
      $(".div-row-action").show();
    }
  },
  handleSubmit: function(bench) {
    $.ajax({
      url: '/api/benchs',
      dataType: 'json',
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify(bench),
      dataType: 'json',
      success: function(data) {
        $(".bench-mark-form-input-t").animate({"width": "-=140px"}, 200, function() {
          $('.bench-mark-form-input-t').hide();
          $('.bench-mark-form-input-t').val('');
        });
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {
      data: [],
      checkeds: [],
    };
  },
  handleReleaseHost: function() {
    var checkeds = this.state.checkeds;
    console.log(checkeds);
    var hosts = checkeds.reduce(function(prev, current) {
      prev += current.hostname + '\n';
      return prev;
    }, '');

    var answer = window.confirm('确定要让这些主机上场吗？\n' + hosts);
    if (answer) {
      $.ajax({
        url: '/api/benchs',
        dataType: 'json',
        method: 'delete',
        contentType: 'application/json',
        data: JSON.stringify(checkeds),
        dataType: 'json',
        success: function(data) {
          $(".div-row-selected").hide();
          $(".div-row-action").show();
          $(".table-benchs input:checked").each(function(index) {
            $(this).parent().parent().parent().parent().css("background-color", "white");
            $(this).prop("checked", false);
          });

          this.setState({
            data: data,
            checkeds: [],
          });
        }.bind(this),
        error: function(error, status) {
          console.log('Please handle ajax error');
        }.bind(this)
      });
    }
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/benchs',
      dataType: 'json',
      method: 'get',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  render: function() {
    var item = this.state.data;
    var self = this;
    var benchs = item.map(function(bench) {
      return (
        <BenchItem data={bench} handleCheck={self.handleCheck}/>
      );
    });
    var length = item.length;
    return (
      <div>
        <div>
          <span className="span-injury">伤病名单</span>
        </div>
        <AlertList handleSubmit={this.handleSubmit}/>
        <div>
          <span className="span-benchs">板凳席</span>
        </div>
        <div className="div-data-table table-responsive">
          <div className="div-actionbar">
            <div className="div-row-action">
              <a className="a-mark-row" onClick={this.handleMarkHost}>标记</a>
              <span className="span-badge badge">{length}</span>
              <BenchMarkForm handleSubmit={this.handleSubmit}/>
            </div>
            <div className="div-row-selected">
              <span className="span-selected"></span>
              <span className="span-release" onClick={this.handleReleaseHost}><i className="fa fa-trash"> </i></span>
            </div>
          </div>
          <table className="table-benchs table table-hover">
            <tbody>
              <tr>
                <td>
                  <div className="checkbox">
                    <label>
                      <input type="checkbox" id="inputAllCheck" value="all" onClick={this.handleCheck}/>
                    </label>
                  </div>
                </td>
                <td>主机名</td>
                <td>IP地址</td>
                <td>标记时间</td>
              </tr>
              {benchs}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = BenchList;
