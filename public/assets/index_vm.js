var HostList = React.createClass({

  handleSearch: function(searchForm) {
    $.ajax({
      url: $(searchForm).attr('action'),
      data: $(searchForm).serialize(),
      method: $(searchForm).attr('method') || 'get',
      success: function(data, status) {
        this.setState({data: data});
        $('.div-guests-content').hide();
        $('.div-vm-host-d').trigger('click');
        $('#divSearchIcon').trigger('click');
      }.bind(this),
      error: function(error, status) {
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
      }.bind(this),
    });
  },
  render: function() {
    var hostList = this.state.data.map(function(item){
      return (
        <HostItem data={item} />
      )
    });
    return (
      <div id="HostList">
        {hostList}
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
    var vmList = item.domain.map(function(vm) {
      return (
        <VmList data={vm} />
      );
    });

    return (
      <div className="div-vm-host-item">
      <div className="div-vm-host-d" onClick={this.handleToggle}>
      <span className="span-vm-icon">
        <i className="fa fa-circle"> </i>
      </span>
      <span className="span-vm-hostname">{item.hostname}</span>
      <span>----</span>
      <span className="span-vm-ip">{item.ip}</span>
      <div className="div-vm-badge">
        <span className="badge">{item.domain.length}</span>
      </div>
      <div className="div-layout-spacer"></div>
      <span className="span-collapse-expand"><i className="fa fa-caret-down"> </i></span>
      </div>
      <div className="div-guests-content">
        <div className="tb-guest-item table-responsive">
        <table className="table table-hover">
          <thead>
          <tr><th>status</th><th>Hostname</th><th>IP</th><th>Domain</th><th>UUID</th><th>MAC</th></tr>
          </thead>
          <tbody>{vmList}</tbody>
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
        <td>{vm.uuid}</td>
        <td>{vm.mac}</td>
      </tr>
    );
  }
});

$(document).ready(function() {
  var mainContent;

  $('.form-remote').submit(function(ev){
    ev.preventDefault();
    if (mainContent instanceof HostList){
      mainContent.handleSearch(ev.target);
    }
  });

  $('#divSearchIcon').click(function(e) {
    $(".search-form-input-t").val('');
    if($(".search-form-input-t").css('display') == 'none') {
      $(".search-form-input-t").show();
      $(".search-form-input-t").animate({"width": "+=176px"}, 200);
      $(".search-form-input-t").focus();
    }
    else {
      $(".search-form-input-t").animate({"width": "-=176px"}, 200, function() {
        $('.search-form-input-t').hide();
      });
    }
  });

  $('ul').click(function(ev) {
    $('ul').children('li').removeClass('slice-selected');
    var parent = $(ev.target).parent();
    $(parent).addClass('slice-selected');
    switch($(parent).attr('id')) {
      case 'vmTab':
        mainContent = React.render(<HostList />, $('.div-main-content')[0]);
        break;
      case 'urlTab':
        mainContent = React.render(
          <UrlTab />,
          $('.div-main-content')[0]
        );
        React.render(
          <BxsLinkForm />,
          $('#link-form')[0]
        );
        break;
     }
  });

  $('#vmTab > span').trigger('click');
});