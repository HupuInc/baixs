$(document).ready(function() {
  var templHostItem = '<div class="div-vm-host-item"><div class="div-vm-host-d"><span class="span-vm-icon"><i class="fa fa-circle"> </i></span><span class="span-vm-hostname"><vmmHostname></span><span>----</span><span class="span-vm-ip"><vmmHostIp></span><div class="div-vm-badge"><span class="badge"><vmmBadge></span></div><div class="div-layout-spacer"></div><span class="span-collapse-expand"><i class="fa fa-caret-down"> </i></span></div><div class="div-guests-content"><div class="tb-guest-item table-responsive"><table class="table table-hover"><thead><tr><th>status</th><th>Hostname</th><th>IP</th><th>Domain</th><th>UUID</th><th>MAC</th></tr></thead><tbody><tableContent></tbody></table></div></div></div>';
  var templRow = '<tr><th class="th-vm-status"><i class="fa fa-circle"> </i></th><td><guestHostname></td><td><guestIp></td><td><guestDomain></td><td><guestUUID></td><td><guestMac></td></tr>';
  var templSearchTip = '<h3>Search Result for \'<title>\'</h3><hr>';
  var templEmpty = '<div class="div-empty"><h3>这里并没有虚拟机。。。</h3></div>';

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

  function initMainContent(data, status) {
    $('.div-main-content').html('');
    if (0 === data.length) {
      initEmptyContent();
      return;
    }
    data.forEach(function(host) {
      var tableContent = '';
      host.domain.forEach(function(guest) {
        var templRowTmp = templRow;
        tableContent += templRowTmp.replace('<guestHostname>', guest.hostname).replace('<guestIp>', guest.ip).replace('<guestDomain>', guest.domain).replace('<guestUUID>', guest.uuid).replace('<guestMac>', guest.mac);
      });
      var hostItem = templHostItem.replace('<vmmHostname>', host.hostname).replace('<vmmHostIp>', host.ip).replace('<tableContent>', tableContent).replace('<vmmBadge>', host.domain.length);
      $('.div-main-content').append(hostItem);
    });
    $('.div-vm-host-d').click(function(e) {
      var that = $(this);
      $(that).parent().find(".div-guests-content").slideToggle(300, function() {
        var i = $(that).find('i');
        if($(i).hasClass('fa-caret-down'))
          $(i).removeClass('fa-caret-down').addClass('fa-caret-up');
        else
          $(i).removeClass('fa-caret-up').addClass('fa-caret-down');
      });
    });
  }

  function initEmptyContent() {
    $('.div-main-content').append(templEmpty);
  }

  $('.form-remote').submit(function(ev){
    ev.preventDefault();
    $.ajax({
      url: $(this).attr('action'),
      data: $(this).serialize(),
      method: $(this).attr('method') || 'get',
      success: function(data, status) {
        initMainContent(data, status);
        $('.div-main-content').prepend(templSearchTip.replace('<title>', $(".search-form-input-t").val()));
        $('.span-collapse-expand').trigger('click');
        $('#divSearchIcon').trigger('click');
      },
      error: function(error, status) {
        initEmptyContent();
      },
    });
  });

  $('ul').click(function(ev) {
    $(this).children('li').removeClass('slice-selected');
    var parent = $(ev.target).parent();
    $(parent).addClass('slice-selected');
    switch($(parent).attr('id')) {
      case 'vmTab':
        $.ajax({
          url: '/api/vmhosts',
          dataType: 'json',
          method: 'get',
          success: initMainContent,
          error: function(error, status) {
            initEmptyContent();
          },
        });
        break;
      case 'urlTab':
        React.render(
          <UrlTab />,
          //$('.div-main-content').context
          document.getElementById('divMainContent')
        );
        React.render(
          <BxsLinkForm />,
          document.getElementById('link-form')
        );
        break;
     }
  });
});