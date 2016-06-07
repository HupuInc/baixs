var $ = require('jquery');
var React = require('react');

var HostList = React.createClass({
  request: function(location) {
    var url = '/api/vmhosts';
    $.ajax({
      url: url,
      dataType: 'json',
      method: 'get',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this),
    });
  },
  handleSearchSubmit: function(searchForm) {
    $.ajax({
      url: $(searchForm).attr('action'),
      data: $(searchForm).serialize(),
      method: $(searchForm).attr('method') || 'get',
      success: function(data, status) {
        this.setState({data: data});
        var count = data.reduce(function(p, c, i) {
          return p + c.domain.length;
        }, 0);
        $('#SpanSearch').html('搜索结果：命中' + count + '条');
        $('.div-vm-hosts-list').hide();
        $('.div-radio').hide();
        $('#SearchResult').show();
        $('.div-vm-hosts-top').trigger('click');
        $('#divSearchIcon').trigger('click');
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  handleBack: function() {
    $('.div-vm-hosts-list').hide();
    $('#SearchResult').hide();
    this.request();
  },
  getInitialState: function() {
    return {
      data: []
    };
  },
  componentDidMount: function() {
    this.request();
  },
  render: function() {
    var hostList = this.state.data.map(function(item){
      return (
        <HostItem data={item} />
      )
    });
    return (
      <div>

        <div id="SearchResult" className="search-result">
          <span id="SpanSearch"></span>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <a href="javascript:void(0)" onClick={this.handleBack}>返回</a>
        </div>
        <div id="HostList">
          {hostList}
        </div>
      </div>
    );
  }
});

var HostItem = React.createClass({
  handleToggle: function(ev) {
    var container = $(this.getDOMNode());
    container.find('.div-vm-hosts-list').slideToggle(300, function() {
      var i = container.find('i');
      if($(i).hasClass('fa-caret-down')) {
        $(i).removeClass('fa-caret-down').addClass('fa-caret-up');
      }
      else {
        $(i).removeClass('fa-caret-up').addClass('fa-caret-down');
      }
    });
  },
  render: function() {
    var item = this.props.data;
    var length = 0;
    if (item.domain) {
      var vmList = item.domain.map(function(vm) {
        return (
          <VmList data={vm} />
        );
      });
      length = item.domain.length;
    }

    // system.cpu.load[percpu,avg1]
    // net.if.in[eth0]
    // net.if.out[eth0]
    // vfs.dev.read[sdb, ops,]
    // vfs.dev.write[sdb, ops,]
    // vm.memory.size[total]
    // system.cpu.num

    var vmListStyle = {};
    var vmmItemStyle = {}

    if (0 === length) {
      vmListStyle.display = 'none';
      vmmItemStyle['border-top-color'] = '#7d7d7d';
    }

    var cpuLoad = item.metrics['system.cpu.load[percpu,avg1]'];
    var cpuProgressLength = cpuLoad * 100;
    var trafficIn = item.metrics['net.if.in[eth0]'] / 1000 / 1000;
    var trafficOut = item.metrics['net.if.out[eth0]'] / 1000 / 1000;
    var trafficProgressLength = trafficIn / (trafficIn + trafficOut) * 100

    return (
      <div className="div-vm-host-out col-md-6 col-xs-12">
        <div className="div-vm-host-item" style={vmmItemStyle}>
          <div className="div-vmm-title">
            <div className="div-vmm-title-left">
              <span className="span-vmm-hostname">{item.hostname}</span>
              <span className="span-vmm-ip">IP: {item.ip}</span>
            </div>
            <div className="div-vmm-title-center">
              <span className="span-badge badge">{length}</span>
            </div>
            <div className="div-vmm-title-right">
              <span className="span-vmm-c-m">{item.metrics['system.cpu.num']} C / {(item.metrics['vm.memory.size[total]'] / 1024 / 1024 / 1024).toFixed(2)} G</span>
            </div>
          </div>
          <div className="div-vmm-status">
              <div className="progress-group">
                <span className="progress-text">CPU Load</span>
                <span className="progress-number">{cpuLoad} / 1</span>
                <div className="progress sm">
                  <div className="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style={{width: cpuProgressLength + '%'}}>
                  </div>
                </div>
              </div>
              <div className="progress-group">
                <span className="progress-text">eth0 Traffic</span>
                <span className="progress-number">IN: {trafficIn.toFixed(2)} Mb / OUT: {trafficOut.toFixed(2)} Mb</span>
                <div className="progress sm">
                  <div className="progress-bar progress-bar-warning progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style={{width: trafficProgressLength + '%'}}>
                  </div>
                  <div className="progress-bar progress-bar-danger progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style={{width: 100 - trafficProgressLength + '%'}}>
                  </div>
                </div>
              </div>
          </div>
          <div className="div-vm-hosts" style={vmListStyle}>
            <div className="div-vm-hosts-top" onClick={this.handleToggle}>
              <span className="span-collapse-expand">
                <i className="fa fa-caret-down"> </i>
              </span>
            </div>
            <div className="div-vm-hosts-list">
              {vmList}
            </div>
          </div>
        </div>
      </div>
    );
  }
});

var VmList = React.createClass({
  render: function() {
    var vm = this.props.data;
    return (
      <div className="div-vm-host">
        <span className="span-vm-hostname">{vm.hostname}</span>
        <div className="div-vm-secondary">
          <span className="span-vm-ip">IP: {vm.ip}</span>
          &nbsp;&nbsp;
          <span className="span-vm-domain">Domain: {vm.domain}</span>
        </div>
      </div>
    );
  }
});

module.exports = HostList;