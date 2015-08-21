$(document).ready(function() {
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
});