function formatDate(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  m = (m < 10 ? '0':'') + m;
  d = (d < 10 ? '0':'') + d;
  return date.getFullYear() + "-" + m + "-" + d;
}

function formatDateTime(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  var hh = date.getHours();
  var mm = date.getMinutes();
  var ss = date.getSeconds();
  m = (m < 10 ? '0':'') + m;
  d = (d < 10 ? '0':'') + d;
  hh = (hh < 10 ? '0':'') + hh;
  mm = (mm < 10 ? '0':'') + mm;
  ss = (ss < 10 ? '0':'') + ss;
  return date.getFullYear() + "-" + m + "-" + d + " " + hh + ":" + mm + ":" + ss;
}

function calcAge(value) {
  var result = '';
  var minutes = value / 60;
  var seconds = parseInt(value % 60);
  var hours = minutes / 60;
  var days = hours / 24;
  var months = parseInt(days / 30);
  minutes = parseInt(minutes % 60);
  hours = parseInt(hours % 24);
  days = parseInt(days % 30);

  result += months === 0 ? '' : months + '月 ';
  result += days === 0 ? '' : days + '天 ';
  result += hours === 0 ? '' : hours + '小时 ';
  result += minutes === 0 ? '' : minutes + '分钟 ';
  result += seconds === 0 ? '' : seconds + '秒';
  return result;
}