var $ = require('jquery');
var React = require('react');

var LocationRadio = React.createClass({
  render: function() {
    return (
      <div className="div-radio">
        <div className="radio-inline">
          <label>
            <input type="radio" name="optionsRadios" id="optionsRadios1" defaultValue="all" defaultChecked onClick={this.props.onRadioEvent} />
            全部
          </label>
        </div>
        <div className="radio-inline">
          <label>
            <input type="radio" name="optionsRadios" id="optionsRadios2" defaultValue="jh" onClick={this.props.onRadioEvent} />
            一期
          </label>
        </div>
        <div className="radio-inline">
          <label>
            <input type="radio" name="optionsRadios" id="optionsRadios3" defaultValue="jhyd" onClick={this.props.onRadioEvent} />
            二期
          </label>
        </div>
      </div>
    );
  }
});

var HostList = React.createClass({
  request: function(location) {
    var url = '/api/vmhosts';
    if (location) {
      url = url + '/' + location;
    }
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
        $('.div-guests-content').hide();
        $('.div-radio').hide();
        $('.div-vm-host-d').trigger('click');
        $('#divSearchIcon').trigger('click');
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  handleRadioEvent: function(event) {
    var loc = $(event.target).val();
    this.request(loc);
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
        <LocationRadio onRadioEvent={this.handleRadioEvent} />
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
    container.find('.div-guests-content').slideToggle(300, function() {
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

    return (
      <div className="div-vm-host-item">
      <div className="div-vm-host-d row" onClick={this.handleToggle}>
      <span className="span-vm-icon col-md-1 col-xs-1">
        <i className="fa fa-circle"> </i>
      </span>
      <div className="col-md-10 col-xs-10">
      <span className="span-vm-hostname">{item.hostname}</span>
      <span>----</span>
      <span className="span-vm-ip">{item.ip}</span>
      <span className="span-badge badge">{length}</span>
      </div>
      <span className="span-collapse-expand"><i className="fa fa-caret-down"> </i></span>
      </div>
      <div className="div-guests-content">
        <div className="tb-guest-item table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>状态</th>
              <th>主机名</th>
              <th>IP地址</th>
              <th>KVM域</th>
            </tr>
          </thead>
          <tbody>
            {vmList}
          </tbody>
        </table>
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
      <tr>
        <th className="th-vm-status"><i className="fa fa-circle"> </i></th>
        <td>{vm.hostname}</td>
        <td>{vm.ip}</td>
        <td>{vm.domain}</td>
      </tr>
    );
  }
});

module.exports = HostList;