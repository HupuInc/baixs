
var VmHostList = React.createClass({
  render: function() {
    return (
      <div id="VmHostList">
        <VmHostItem />
      </div>
    );
  }
});

var VmHostItem = React.createClass({
  render: function() {
    return (
      <div className="div-vm-host-item">
      <div className="div-vm-host-d">
      <span className="span-vm-icon">
        <i className="fa fa-circle"> </i>
      </span>
      <span className="span-vm-hostname">vmmHostname</span>
      <span>----</span>
      <span className="span-vm-ip">vmmHostIp</span>
      <div className="div-vm-badge">
        <span className="badge">vmmBadge</span>
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
          <tbody>tableContent</tbody>
        </table>
        </div>
      </div>
      </div>
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
        React.render(<VmHostList />, $('.div-main-content')[0]);
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