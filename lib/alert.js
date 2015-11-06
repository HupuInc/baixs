var exec = require('child_process').exec;
var util = require('util');

var COMMAND = 'zabbix_sender -c /etc/zabbix/zabbix_agentd.conf -s "%s" -k url.monitor.error -o "%s"';
exports.send = function(hostname, msg) {
  var cmd = util.format(COMMAND, hostname, msg);
  exec(cmd, function(err, stdout, stderr) {
    console.log(stderr);
    if (err) {
      console.error(err.toString());
    }
  });
};
