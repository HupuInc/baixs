var $ = require('jquery');
var React = require('react');

var mttrBgColor = [
  "#4B94C0",
  "#dd4b39",
  "#00a65a",
  "#f39c12"
];

var MttrItem = new React.createClass({
  render: function() {
    var mttr = this.props.data;
    var randomColor = mttrBgColor[Math.floor(Math.random() * 4)];
    var width = mttr.rate > 100 ? 100 : mttr.rate * 5;
    var length = mttr.hosts.length;
    var style = {
      'width': width + "%",
      'background-color': randomColor
    };

    return (
      <div className="div-mttr-item">
        <div className="div-mttr-info">
          <div className="project-name">
            {mttr.project}
            <span className="span-badge badge">{length}</span>
          </div>
          <div className="mttr-rate">
            {mttr.rate}%
          </div>
        </div>
        <div>
          <div className="mttr-bg">
            <div className="mttr-real-bg" style={style}>
            </div>
          </div>
        </div>
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
    var mttrs = Object.keys(item).map(function(key){
      return (
        <MttrItem data={item[key]} />
      );
    });
    return (
      <div>
        <div>
          <span className="span-benchs">平均维护时间(最近一周)</span>
        </div>
        <div className="div-data-table div-mttr-content">
          {mttrs}
        </div>
      </div>
    );
  }
});

var VmmItem = new React.createClass({
  render: function() {
    var vmm = this.props.data;
    var length = 0;
    if (vmm.domain) {
      length = vmm.domain.length;
    }
    var widthRate = length / 5 * 100;
    if (widthRate > 100) {
      widthRate = 100;
    }
    var style = {
      'width': widthRate + "%"
    };
    return (
      <div className="col-md-4 col-sm-6 col-xs-12 row div-vmm-card">
        <div className="col-md-5 col-sm-5 div-vmm-card-left">
          <span>{vmm.ip}</span>
        </div>
        <div className="div-vmm-card-right col-md-7 col-sm-7">
          <div className="div-vmm-info">
            <span>{length}/5</span>
            <div className="div-vmm-line" style={style}>
            </div>
          </div>
        </div>
      </div>
    )
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
    var vmms = item.map(function(vmm){
      return (
        <VmmItem data={vmm} />
      );
    });
    return (
      <div>
        <div className="row">
          {vmms}
        </div>
      </div>
    );
  }
});

var Dashboard = new React.createClass({
  render: function() {
    return (
      <div>
        <VmmArea />
        <MttrArea />
      </div>
    );
  }
});

module.exports = Dashboard;