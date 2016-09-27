var $ = require('jquery');
var _ = require('lodash');
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
    $('#bench > a > span').trigger('click');
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

var VmmArea = new React.createClass({
  getInitialState: function() {
    return {
      data: {
        total: 0,
        current: 0,
        stats: [],
      }
    };
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/vm_counter',
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
    var vmData = item.stats.map(function(stat) {
      return [parseInt(stat.day), stat.count];
    });

    var vmmConfig = {
      title: {
        text: "过去一周虚拟机开设曲线"
      },
      xAxis: {
        type: 'datetime',
        gridLineWidth: 1,
        dateTimeLabelFormats: {
          day: '%b. %e'
        },
        minRange: 12 * 3600000,
      },
      yAxis: {
        min: 0,
        title: {
          text: 'NUM'
        }
      },
      series: [{
        name: 'vmm',
        data: vmData,
      }]
    };

    return (
      <div className="div-content">
        <div>
          <div className="small-box bg-green">
            <div className="inner">
              <h3>{item.current}/{item.total}</h3>
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
    var css = this.props.css;
    var statusClass = '';

    if (link.status == null || (link.status >= 300 && link.status < 400)) {
      statusClass = 'warning';
    }
    else if (link.status >= 400) {
      statusClass = 'danger';
    }
    return (
      <tr className={statusClass}>
        <td>{link.url}</td>
        <td>{link.proxy}</td>
        <td>{link.status}</td>
        <td className={css}>{link.lastResTime}</td>
      </tr>
    );
  }
});

var UrlComponent = new React.createClass({
  render: function() {
    var data = this.props.data;
    var css = this.props.css;
    var title = this.props.title;
    var links = data.map(function(link) {
      return (
        <UrlItem data={link} css={css}/>
      );
    });

    return (
      <div className="div-data-table div-content">
        <div className="div-url-title">
          <span>{title}</span>
        </div>
        <div className="div-url-content table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>URL</th>
                <th>Proxy</th>
                <th>状态码</th>
                <th className={css}>响应时间</th>
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
    $('#url > a > span').trigger('click');
  },
  render: function() {
    var items = this.state.data;
    var grouped = {};
    var links = [];
    items.forEach(function(link) {
      var value = link.value;
      if (!_.has(grouped, value.url) ||
        value.lastResTime > grouped[value.url].value.lastResTime) {
        grouped[value.url] = link;
      }
      if (value.status >= 300) {
        links.push(link);
      }
    });

    grouped = _.sortBy(grouped, function(n) {
      return -n.value.lastResTime;
    }).slice(0,5);

    return (
      <div>
        <UrlComponent data={links} css="hidden" title="URL监控"/>
        <UrlComponent data={grouped} css="show" title="响应时间TOP5"/>
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
          <div className="div-col col-lg-6">
            <VmmArea />
          </div>
          <div className="div-col col-lg-6">
            <UrlArea />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Dashboard;