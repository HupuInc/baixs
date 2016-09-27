var $ = jQuery = require('jquery');
var React = require('react');
var Postoffice = require('./postoffice');
var Dashboard = require('./dashboard.jsx');
var UrlTab = require('./urltab.jsx');
var ReconnectWebsocket = require('./lib/reconnectWebsocket');

require('bootstrap');

var url = 'ws://' + document.URL.substr(7).split('/')[0] + '/channel';
var socket = new ReconnectWebsocket(url, 'baixs-protocol');
socket.on('onmessage', Postoffice.collect.bind(Postoffice));

$(document).ready(function() {
  var mainContent;
  $('ul').click(function(ev) {
    $('ul').children('li').removeClass('slice-selected');
    var parent = $(ev.target).parent().parent();
    $(parent).addClass('slice-selected');
    switch($(parent).attr('id')) {
      case 'dash':
        mainContent = React.render(
          <Dashboard />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('Dashboard');
        break;
      case 'url':
        mainContent = React.render(
          <UrlTab />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('URL Monitor');
        break;
    }
    if ($(document.body).width() < 769) {
      $('.div-left-nav').removeClass('show');
    }
  });

  $('.btn-collapse').click(function(e) {
    if ($('.div-left-nav').hasClass('show')) {
      $('.div-left-nav').removeClass('show');
    }
    else {
      $('.div-left-nav').addClass('show');
    }
  });

  var hash = window.location.hash;
  if (hash) {
    var identified = hash.toString() + ' > a > span';
    $(identified).trigger('click');
  }
  else {
    $('#dash > a > span').trigger('click');
  }
});


$(window).resize(function() {
  if ($(document.body).width() >= 769) {
    $('.div-left-nav').removeClass('show');
  }
});
