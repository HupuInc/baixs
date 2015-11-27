var $ = jQuery = require('jquery');
var React = require('react');
var Postoffice = require('./postoffice');
var Dashboard = require('./dashboard.jsx');
var HostList = require('./vm.jsx');
var UrlTab = require('./urltab.jsx');
var BenchList = require('./benchs.jsx');

require('bootstrap');

var url = 'ws://' + document.URL.substr(7).split('/')[0] + '/channel';
var socket = new WebSocket(url, 'baixs-protocol');
socket.onmessage = Postoffice.collect.bind(Postoffice);

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
          <input className="search-form-input-t search-form-input" type="text" name="q" placeholder="搜索" />
      </form>
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
      case 'dashTab':
        mainContent = React.render(
          <Dashboard />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('Dashboard');
        $('#divSearchForm').hide();
        break;
      case 'vmTab':
        mainContent = React.render(<HostList />, $('.div-main-content')[0]);
        $('#divSearchForm').show();
        React.render(
          <SearchForm onSearchSubmit={mainContent.handleSearchSubmit} />,
          $('#divSearchForm')[0]
        );
        $('.span-header-title').html('VM');
        break;
      case 'urlTab':
        $('#divSearchForm').show();
        mainContent = React.render(
          <UrlTab />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('URL Monitor');
        break;
      case 'benchTab':
        $('#divSearchForm').hide();
        mainContent = React.render(
          <BenchList />,
          $('.div-main-content')[0]
        );
        $('.span-header-title').html('Benchs');
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

  $('#dashTab > span').trigger('click');
});

$(window).resize(function() {
  if ($(document.body).width() >= 769) {
    $('.div-left-nav').removeClass('show');
  }
});
