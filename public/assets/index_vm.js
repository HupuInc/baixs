var SampleItem = {
  "ip": "192.168.20.3",
  "hostname": "vmm-20-3-prd.jh.hupu.com",
  "domain": [
    {
      "mac": "00:16:3e:49:00:94",
      "ip": "192.168.20.83",
      "uuid": "3fd195bf-7bd2-43b8-bfbc-e162f5edbb8c",
      "domain": "4qrhlcwn",
      "hostname": "pub-baixs-20-83-prd.vm.jh.hupu.com"
    },
    {
      "mac": "00:16:3e:13:a4:4f",
      "ip": "192.168.20.84",
      "uuid": "be6f6e29-b7c4-4ab4-bc46-db250c1942b4",
      "domain": "xjpe39tz",
      "hostname": "kq-caipiao-20-84-prd.vm.jh.hupu.com"
    }
  ],
  "has_problems": "yes"
};

var HostList = React.createClass({
  render: function() {
    return (
      <div id="HostList">
        <HostItem data={SampleItem} />
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

  $('ul').click(function(ev) {
    $('ul').children('li').removeClass('slice-selected');
    var parent = $(ev.target).parent();
    $(parent).addClass('slice-selected');
    switch($(parent).attr('id')) {
      case 'vmTab':
        React.render(<HostList />, $('.div-main-content')[0]);
        break;
      case 'urlTab':
        React.render(
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