var SearchForm = React.createClass({
  handleShowSearch: function(ev) {
    $(".search-form-input-t").val('');
    if($(".search-form-input-t").css('display') == 'none') {
      $(".search-form-input-t").show();
      $(".search-form-input-t").animate({"width": "+=120px"}, 200);
      $(".search-form-input-t").focus();
    }
    else {
      $(".search-form-input-t").animate({"width": "-=120px"}, 200, function() {
        $('.search-form-input-t').hide();
      });
    }
  },
  handleSubmit: function(ev) {
    ev.preventDefault();
    var searchForm = $(this.getDOMNode());
    this.props.onSearchSubmit(searchForm);
  },
  render: function() {
    return (
      <form action="/api/vm_search" method="get" acceptCharset="utf-8" className="search-form form-remote" onSubmit={this.handleSubmit}>
        <div id="divSearchIcon" className="search-icon fa fa-search" onClick={this.handleShowSearch}> </div>
          <input className="search-form-input-t search-form-input" type="text" name="q" placeholder="Search" />
      </form>
    );
  }
});

var HostList = React.createClass({
  handleSearchSubmit: function(searchForm) {
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
              <th>status</th>
              <th>Hostname</th>
              <th>IP</th>
              <th>Domain</th>
              <th>UUID</th>
              <th>MAC</th>
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
        <td>{vm.uuid}</td>
        <td>{vm.mac}</td>
      </tr>
    );
  }
});

$(document).ready(function() {
  var mainContent;

  $('ul').click(function(ev) {
    $('ul').children('li').removeClass('slice-selected');
    var parent = $(ev.target).parent();
    $(parent).addClass('slice-selected');
    switch($(parent).attr('id')) {
      case 'vmTab':
        mainContent = React.render(<HostList />, $('.div-main-content')[0]);
        React.render(
          <SearchForm onSearchSubmit={mainContent.handleSearchSubmit} />,
          $('#divSearchForm')[0]
        );
        $('.span-header-title').html('VM');
        break;
      case 'urlTab':
        mainContent = React.render(
          <UrlTab />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('URL Monitor');
        break;
      case 'benchTab':
        mainContent = React.render(
          <BenchList />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('Benchs');
        break;
     }
  });

  $('#vmTab > span').trigger('click');
});
