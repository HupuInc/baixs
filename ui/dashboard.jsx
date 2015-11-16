var $ = require('jquery');
var React = require('react');
var Highcharts = require('react-highcharts/dist/bundle/highcharts');
var EventStore = require('./store/event');
var LinkStore = require('./store/link');

var EventItem = new React.createClass({
  render: function() {
    var priority = this.props.priority;
    var eventClass = 'small-box ' + priority;
    var count = this.props.count;
    var name = priority.slice(priority.indexOf('td-prioriy-') + 11);
    return (
      <div className="div-col col-lg-3 col-xs-6">
        <div className={eventClass}>
          <div className="inner">
            <h3>{count}</h3>
            <p>{name}</p>
          </div>
        </div>
      </div>
    );
  }
});

var EventArea = new React.createClass({
  getInitialState: function() {
    return {
      data: [],
    };
  },
  componentDidMount: function() {
    EventStore.on('change', this.handleChange);
    EventStore.emit('change', EventStore.toArray());
  },
  componentWillUnmount: function() {
    EventStore.removeListener('change', this.handleChange);
  },
  handleChange: function(data) {
    this.setState({data: data});
  },
  handleClick: function() {
    $('#benchTab > span').trigger('click');
  },
  render: function() {
    var events = this.state.data;
    var eventStat = {
      'td-prioriy-warning': 0,
      'td-prioriy-average': 0,
      'td-prioriy-high': 0,
      'td-prioriy-disaster': 0,
    }
    events.forEach(function(event) {
      switch (parseInt(event.value.priority)) {
        case 2:
          eventStat['td-prioriy-warning'] += 1;
          break;
        case 3:
          eventStat['td-prioriy-average'] += 1;
          break;
        case 4:
          eventStat['td-prioriy-high'] += 1;
          break;
        case 5:
          eventStat['td-prioriy-disaster'] += 1;
          break;
      }
    });

    var eventItems = Object.keys(eventStat).map(function(key) {
      return (
        <EventItem priority={key} count={eventStat[key]}/>
      );
    });

    return (
      <div className="row" >
        {eventItems}
        <a href="javascript:void(0)" className="small-box-footer" onClick={this.handleClick}>更多信息 <i className="fa fa-arrow-circle-right"></i></a>
      </div>
    );
  }
});

var MttrArea = new React.createClass({
  getInitialState: function() {
    return {
      data: {}
    };
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/dashboard/mttr',
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
    var series = [];
    Object.keys(item).map(function(key) {
      series.push({name: key, y: parseFloat(item[key]['rate'])});
    });
    var mttrConfig = {
      chart: {
        type: 'column'
      },
      title: {
        "text": "最近一周平均维护时间Top5"
      },
      xAxis: {
        type: 'category'
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Mttr(%)'
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        column: {
            pointPadding: 0.2,
            borderWidth: 0
        }
      },
      series: [{name: 'mttr', colorByPoint: true, data: series}]
    };
    return (
      <div className="div-data-table div-content">
        <Highcharts config={mttrConfig} ref="chart" />
      </div>
    );
  }
});

var VmmArea = new React.createClass({
  getInitialState: function() {
    return {
      data: []
    };
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/vmhosts',
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
    var total = item.length * 6;
    var current = 0;
    item.forEach(function(v) {
      current += v.domain.length;
    })
    var vmmConfig = {
      title: {
        text: "每日虚拟机增长"
      },
      xAxis: {
        type: 'datetime',
        gridLineWidth: 1
      },
      yAxis: {
        min: 0,
        title: {
          text: 'NUM'
        }
      },
      series: [{
        name: 'vmm',
        data: [1, 8, 5, 4, 7, 10, 2],
        pointStart: Date.UTC(2015, 9, 26),
        pointInterval: 24 * 3600 * 1000
      }]
    };
    return (
      <div className="div-content div-col col-lg-6">
        <div>
          <div className="small-box bg-green">
            <div className="inner">
              <h3>{current}/{total}</h3>
              <p>虚拟机统计</p>
            </div>
          </div>
        </div>
        <div className="div-data-table div-content">
          <Highcharts config={vmmConfig} ref="chart" />
        </div>
      </div>
    );
  }
});

var UrlItem = new React.createClass({
  render: function() {
    var link = this.props.data.value;
    var statusClass = '';

    if (link.status == null) {
      statusClass = 'warning';
    }
    else if (link.status >= 300) {
      statusClass = 'danger';
    }
    return (
      <tr className={statusClass}>
        <td>{link.url}</td>
        <td>{link.proxy}</td>
        <td>{link.status}</td>
      </tr>
    );
  }
});

var UrlArea = new React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    LinkStore.on('change', this.handleChange);
    LinkStore.emit('change', LinkStore.toArray());
  },
  componentWillUnmount: function() {
    LinkStore.removeListener('change', this.handleChange);
  },
  handleChange: function(data) {
    this.setState({data: data});
  },
  handleClick: function() {
    $('#urlTab > span').trigger('click');
  },
  render: function() {
    var items = this.state.data;
    var links = items.map(function(link) {
      if (link.value.status >= 300) {
        return (
          <UrlItem data={link} />
        );
      }
    });

    return (
      <div className="div-data-table div-content">
        <div className="div-url-title">
          <span>URL监控</span>
        </div>
        <div className="div-url-content table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>URL</th>
                <th>Proxy</th>
                <th>状态码</th>
              </tr>
            </thead>
            <tbody>
              {links}
            </tbody>
          </table>
        </div>
        <div className="div-url-action">
          <a href="javascript:void(0)" onClick={this.handleClick}>所有URL监控</a>
        </div>
      </div>
    );
  }
});

var Dashboard = new React.createClass({
  render: function() {
    return (
      <div>
        <EventArea />
        <div className="row">
          <VmmArea />
          <div className="div-col col-lg-6">
            <UrlArea />
            <MttrArea />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Dashboard;