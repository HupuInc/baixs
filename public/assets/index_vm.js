$(document).ready(function() {
  var templ1 = '<div class="div-vm-host-item"><div class="div-vm-host-d"><span class="span-vm-icon"><i class="fa fa-circle"> </i></span><span class="span-vm-hostname">';
  var templ2 = '</span><span>----</span><span class="span-vm-ip">';
  var templ3 = '</span><div class="div-layout-spacer"></div><span class="span-collapse-expand"><i class="fa fa-caret-down"> </i></span></div><div class="div-guests-content"><div class="tb-guest-item table-responsive"><table class="table table-hover"><thead><tr><th>status</th><th>Hostname</th><th>IP</th><th>Domain</th><th>UUID</th><th>MAC</th></tr></thead><tbody>';
  var templ4 = '</tbody></table></div></div></div>';
  var templRow = '<tr><th class="th-vm-status"><i class="fa fa-circle"> </i></th><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td></tr>';

  $('#divSearchIcon').click(function(e) {
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

  $.ajax({
    url: '/api/vmhosts',
    dataType: 'json',
    method: 'get',
    success: function(data, status) {
      data.forEach(function(host) {
        var tableContent = '';
        host.domain.forEach(function(guest) {
          tableContent += '<tr><th class="th-vm-status"><i class="fa fa-circle"> </i></th><td>' + guest.hostname + '</td><td>' + guest.ip + '</td><td>' + guest.domain + '</td><td>' + guest.uuid + '</td><td>' + guest.mac + '</td></tr>';
        });
        var hostItem = templ1 + host.hostname + templ2 + host.ip + templ3 + tableContent + templ4;
        $('.div-main-content').append(hostItem);
      });
      $('.span-collapse-expand').click(function(e) {
        var that = $(this);
        $(that).parent().parent().find(".div-guests-content").slideToggle(300, function() {
          var i = $(that).find('i');
          if($(i).hasClass('fa-caret-down'))
            $(i).removeClass('fa-caret-down').addClass('fa-caret-up');
          else
            $(i).removeClass('fa-caret-up').addClass('fa-caret-down');
        });
      });
    },
    error: function(error, status) {

    }
  });
});