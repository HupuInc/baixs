var BenchMarkForm = React.createClass({
  handleSubmit: function(ev) {
    ev.preventDefault();
    var input = $(ev.target).serializeArray();
    var bench = input.reduce(function(prev, current) {
      prev[current.name] = current.value;
      return prev;
    }, {});
    console.log(bench);
    this.props.handleSubmit(bench);
  },
  render: function() {
    return (
      <form action="/api/benchs" method="put" acceptCharset="utf-8" className="bench-mark-form form-remote" onSubmit={this.handleSubmit}>
        <input className="bench-mark-form-input-t bench-mark-form-input" type="text" name="ip" placeholder="IP地址" />
      </form>
    );
  }
});

var BenchItem = React.createClass({
  handleCheck: function(ev) {
    this.props.handleCheck(ev, this.props.data);
  },
  render: function() {
    var item = this.props.data.value;
    var markedDate = new Date();
    var releaseDate = new Date();
    markedDate.setTime(item.markedAt);
    releaseDate.setTime(item.releaseAt);
    var releaseAt = item.releaseAt ? releaseDate.toLocaleString() : '';
    var markedAt = markedDate.toLocaleString();

    return (
      <tr>
        <td>
          <div className="checkbox">
            <label>
              <input type="checkbox" onClick={this.handleCheck}/>
            </label>
          </div>
        </td>
        <td>{item.hostname}</td>
        <td>{item.ip}</td>
        <td>{markedAt}</td>
      </tr>
    );
  }
});

var BenchList = React.createClass({
  handleMarkHost: function() {
    $('.bench-mark-form-input-t').val('');
    if($(".bench-mark-form-input-t").css('display') == 'none') {
      $(".bench-mark-form-input-t").show();
      $(".bench-mark-form-input-t").animate({"width": "+=140px"}, 200);
      $(".bench-mark-form-input-t").focus();
    }
    else {
      $(".bench-mark-form-input-t").animate({"width": "-=140px"}, 200, function() {
        $('.bench-mark-form-input-t').hide();
      });
    }
  },
  handleCheck: function(ev, bench) {
    var self = this;
    function allChecked() {
      var benchs = [];
      self.state.data.map(function(bench) {
        benchs.push(bench.value);
      });
      return benchs;
    }

    function filter(obj) {
      if (obj.ip === bench.value.ip && obj.hostname === bench.value.hostname) {
        return false;
      }
      else {
        return true;
      }
    }

    var id = $(ev.target).attr('id');
    var checkeds = [];
    var backgroundColor = $(ev.target).prop('checked') === true ? "#f5f5f5" : "white";
    if (id) {
      $(".table-benchs input[type='checkbox']").prop("checked", $(ev.target).prop('checked'));
      $(".table-benchs input[type='checkbox']").each(function(index) {
        $(this).parent().parent().parent().parent().css("background-color", backgroundColor);
      });
    }
    else {
      $(ev.target).parent().parent().parent().parent().css("background-color", backgroundColor);
    }

    if ($(ev.target).prop('checked') === true && id) {
      checkeds = allChecked();
    }
    else if ($(ev.target).prop('checked') === true) {
      checkeds = this.state.checkeds;
      checkeds.push(bench.value);
    }
    else if (!id) {
      checkeds = this.state.checkeds;
      checkeds = checkeds.filter(filter);
    }

    this.setState({
      checkeds: checkeds
    });
    var checkedInputs = $(".table-benchs input:checked");
    if (checkedInputs.length > 0) {
      $(".div-row-selected").show();
      $(".div-row-action").hide();
      $(".span-selected").html($("#inputAllCheck").prop('checked') === true ? checkedInputs.length - 1 + " 项已选中" : checkedInputs.length + " 项已选中");
    }
    else {
      $(".div-row-selected").hide();
      $(".div-row-action").show();
    }
  },
  handleSubmit: function(bench) {
    $.ajax({
      url: '/api/benchs',
      dataType: 'json',
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify(bench),
      dataType: 'json',
      success: function(data) {
        $(".bench-mark-form-input-t").animate({"width": "-=140px"}, 200, function() {
          $('.bench-mark-form-input-t').hide();
          $('.bench-mark-form-input-t').val('');
        });
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {
      data: [],
      checkeds: [],
    };
  },
  handleReleaseHost: function() {
    var checkeds = this.state.checkeds;
    console.log(checkeds);
    $.ajax({
      url: '/api/benchs',
      dataType: 'json',
      method: 'delete',
      contentType: 'application/json',
      data: JSON.stringify(checkeds),
      dataType: 'json',
      success: function(data) {
        $(".div-row-selected").hide();
        $(".div-row-action").show();
        $(".table-benchs input:checked").each(function(index) {
          $(this).parent().parent().parent().parent().css("background-color", "white");
          $(this).prop("checked", false);
        });

        this.setState({
          data: data,
          checkeds: [],
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/benchs',
      dataType: 'json',
      method: 'get',
      success: function(data) {
        this.setState({
          data: data
        });
      }.bind(this),
      error: function(error, status) {
        console.log('Please handle ajax error');
      }.bind(this)
    });
  },
  render: function() {
    var item = this.state.data;
    var self = this;
    var benchs = item.map(function(bench) {
      return (
        <BenchItem data={bench} handleCheck={self.handleCheck}/>
      );
    });
    var length = item.length;
    return (
      <div className="div-data-table table-responsive">
        <div className="div-actionbar">
          <div className="div-row-action">
            <a className="a-mark-row" onClick={this.handleMarkHost}>标记</a>
            <span className="span-badge badge">{length}</span>
            <BenchMarkForm handleSubmit={this.handleSubmit}/>
          </div>
          <div className="div-row-selected">
            <span className="span-selected"></span>
            <span className="span-release" onClick={this.handleReleaseHost}><i className="fa fa-trash"> </i></span>
          </div>
        </div>
        <table className="table-benchs table table-hover">
          <tbody>
            <tr>
              <td>
                <div className="checkbox">
                  <label>
                    <input type="checkbox" id="inputAllCheck" value="all" onClick={this.handleCheck}/>
                  </label>
                </div>
              </td>
              <td>主机名</td>
              <td>IP地址</td>
              <td>标记时间</td>
            </tr>
            {benchs}
          </tbody>
        </table>
      </div>
    );
  }
});