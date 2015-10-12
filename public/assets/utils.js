function formatDate(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  m = (m < 10 ? '0':'') + m;
  d = (d < 10 ? '0':'') + d;
  return date.getFullYear() + "" + m + d;
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