var $ = require('jquery');
var React = require('react');
var vmmFilter = {
  mem: 'mem-all',
  vmNum: 'vmNum-all'
};
var sortType = "sortNumAsc";

function sort() {
  var visibleSortedItem = $('.div-vm-host-out:visible').toArray();
  visibleSortedItem.sort(function(a, b) {
    var memA = parseInt($(a).attr('data-mem'));
    var numA = parseInt($(a).attr('data-length'));
    var memB = parseInt($(b).attr('data-mem'));
    var numB = parseInt($(b).attr('data-length'));
    switch(sortType) {
      case 'sortNumAsc':
        if (numA < numB) {
          return -1;
        }
        else {
          return 1;
        }
        break;
      case 'sortNumDesc':
        if (numA < numB) {
          return 1;
        }
        else {
          return -1;
        }
        break;
      case 'sortMemAsc':
        if (memA < memB) {
          return -1;
        }
        else {
          return 1;
        }
        break;
      case 'sortMemDesc':
        if (memA < memB) {
          return 1;
        }
        else {
          return -1;
        }
        break;
    }
  });
  var hiddenItem = $('.div-vm-host-out:hidden').toArray();
  var items = visibleSortedItem.concat(hiddenItem);
  $('#HostList').html(items);
}

function filter() {
  var filterClass = "";
  if (vmmFilter.mem !== 'mem-all') {
    filterClass += "." + vmmFilter.mem;
  }
  if (vmmFilter.vmNum !== 'vmNum-all') {
    filterClass += "." + vmmFilter.vmNum;
  }

  if ("" !== filterClass) {
    $('.div-vm-host-out').hide();
    $(filterClass).show();
  }
  else {
    $('.div-vm-host-out').show();
  }
}

var DropdownItem = React.createClass({
  handleClick: function(ev) {
    this.props.handleClick(ev, this.props.item);
  },
  render: function() {
    var item = this.props.item;
    return (
      <li><a href="javascript:void(0)" id={item.id} onClick={this.handleClick}>{item.desc}</a></li>
    );
  }
});

var VmmFilter = React.createClass({
  handleSort: function(e, item) {
    sortType = item.id;
    $('#' + item.parentId).html('排序: ' + item.desc);
    sort();
    filter();
  },
  handleSelect: function(e, item) {
    var id = item.id;
    vmmFilter[id.split('-')[0]] = id;
    var startText = id.split('-')[0] === 'mem' ? '内存检索' : '虚拟机数量检索';
    $('#' + item.parentId).html(startText + ': ' + item.desc);
    filter();
    sort();
  },
  render: function() {
    var sortItem = [{
      parentId: 'dropdownSortText',
      id: 'sortNumAsc',
      desc: '虚拟机数量从低到高',
      handleClick: this.handleSort
    },
    {
      parentId: 'dropdownSortText',
      id: 'sortNumDesc',
      desc: '虚拟机数量从高到低',
      handleClick: this.handleSort
    },
    {
      parentId: 'dropdownSortText',
      id: 'sortMemAsc',
      desc: '内存从低到高',
      handleClick: this.handleSort
    },
    {
      parentId: 'dropdownSortText',
      id: 'sortMemDesc',
      desc: '内存从高到低',
      handleClick: this.handleSort
    }];

    var memItem = [{
      parentId: 'dropdownMemText',
      id: 'mem-all',
      desc: '全部',
      handleClick: this.handleSelect
    },{
      parentId: 'dropdownMemText',
      id: 'mem-32',
      desc: '32 GB',
      handleClick: this.handleSelect
    },
    {
      parentId: 'dropdownMemText',
      id: 'mem-64',
      desc: '64 GB',
      handleClick: this.handleSelect
    },
    {
      parentId: 'dropdownMemText',
      id: 'mem-128',
      desc: '128 GB',
      handleClick: this.handleSelect
    }];
    var vmNumItem = [];
    vmNumItem.push({
      parentId: 'dropdownVmNumText',
        id: 'vmNum-all',
        desc: '全部',
        handleClick: this.handleSelect
    });
    for (var i = 0; i < 9; i++) {
      var desc = i + '';
      if (i === 8) {
        desc = i + '以上';
      }
      vmNumItem.push({
        parentId: 'dropdownVmNumText',
        id: 'vmNum-' + i,
        desc: desc,
        handleClick: this.handleSelect
      })
    }

    var sortItemList = sortItem.map(function(item){
      return (
        <DropdownItem item={item} handleClick={item.handleClick}/>
      )
    });

    var memItemList = memItem.map(function(item){
      return (
        <DropdownItem item={item} handleClick={item.handleClick}/>
      )
    });

    var vmNumItemList = vmNumItem.map(function(item){
      return (
        <DropdownItem item={item} handleClick={item.handleClick}/>
      )
    });

    return (
      <div className="div-filter btn-toolbar" role="toolbar">
        <div className="btn-group" role="group">
          <div className="btn-group" role="group">
            <button className="btn btn-default dropdown-toggle" type="button" id="dropdownSort" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
              <span id="dropdownSortText">排序</span>
              <span className="caret" style={{'margin-left': '7px'}}></span>
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownSort">
              {sortItemList}
            </ul>
          </div>


          <div className="btn-group div-dropdown" role="group">
            <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMem" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
              <span id="dropdownMemText">内存检索</span>
              <span className="caret" style={{'margin-left': '7px'}}></span>
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMem">
              {memItemList}
            </ul>
          </div>


          <div className="btn-group div-dropdown" role="group">
            <button className="btn btn-default dropdown-toggle" type="button" id="dropdownVmNum" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
              <span id="dropdownVmNumText">虚拟机数量检索</span>
              <span className="caret" style={{'margin-left': '7px'}}></span>
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownVmNum">
              {vmNumItemList}
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

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
        $('.div-filter').hide();
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
    $('.div-filter').show();
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
        <VmmFilter />
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
    var hostMem = item.metrics['vm.memory.size[total]'] / 1024 / 1024 / 1024;
    var divHostItemClass = "div-vm-host-out col-md-6 col-xs-12";
    if (hostMem <= 32) {
      divHostItemClass += " mem-32 ";
      hostMem = '32';
    }
    else if (hostMem > 32 && hostMem <= 64) {
      divHostItemClass += " mem-64 ";
      hostMem = '64';
    }
    else if (hostMem > 64 && hostMem <= 128) {
      divHostItemClass += " mem-128 ";
      hostMem = '128';
    }

    divHostItemClass += "vmNum-" + length;

    return (
      <div className={divHostItemClass} data-mem={hostMem} data-length={length}>
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
              <span className="span-vmm-c-m">{item.metrics['system.cpu.num']} C / {parseFloat(hostMem).toFixed(2)} G</span>
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