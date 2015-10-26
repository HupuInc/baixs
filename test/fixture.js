var linkOne = {
  url: "http://www.gov.cn",
  proxy: null
};

var linkTwo = {
  url: "http://www.cntv.cn",
};

var vmmOne = {
  "key": "/hostvars/192.168.20.3",
  "dir": true,
  "nodes": [{
    "key": "/hostvars/192.168.20.3/has_problems",
    "value": "no",
    "modifiedIndex": 28839,
    "createdIndex": 28839
  }, {
    "key": "/hostvars/192.168.20.3/hostname",
    "value": "vmm-20-3-prd",
    "modifiedIndex": 39296,
    "createdIndex": 39296
  }, {
    "key": "/hostvars/192.168.20.3/domain",
    "dir": true,
    "nodes": [{
      "key": "/hostvars/192.168.20.3/domain/xjpe39tz",
      "dir": true,
      "nodes": [{
        "key": "/hostvars/192.168.20.3/domain/xjpe39tz/ip",
        "value": "192.168.20.84",
        "modifiedIndex": 31545,
        "createdIndex": 31545
      }, {
        "key": "/hostvars/192.168.20.3/domain/xjpe39tz/mac",
        "value": "00:16:3e:13:a4:4f",
        "modifiedIndex": 31544,
        "createdIndex": 31544
      }, {
        "key": "/hostvars/192.168.20.3/domain/xjpe39tz/uuid",
        "value": "be6f6e29-b7c4-4ab4-bc46-db250c1942b4",
        "modifiedIndex": 31546,
        "createdIndex": 31546
      }],
      "modifiedIndex": 25126,
      "createdIndex": 25126
    }, {
      "key": "/hostvars/192.168.20.3/domain/4qrhlcwn",
      "dir": true,
      "nodes": [{
        "key": "/hostvars/192.168.20.3/domain/4qrhlcwn/uuid",
        "value": "3fd195bf-7bd2-43b8-bfbc-e162f5edbb8c",
        "modifiedIndex": 31542,
        "createdIndex": 31542
      }, {
        "key": "/hostvars/192.168.20.3/domain/4qrhlcwn/ip",
        "value": "192.168.20.83",
        "modifiedIndex": 31541,
        "createdIndex": 31541
      }, {
        "key": "/hostvars/192.168.20.3/domain/4qrhlcwn/mac",
        "value": "00:16:3e:49:00:94",
        "modifiedIndex": 31540,
        "createdIndex": 31540
      }],
      "modifiedIndex": 25060,
      "createdIndex": 25060
    }, {
      "key": "/hostvars/192.168.20.3/domain/er34w9dx",
      "dir": true,
      "nodes": [{
        "key": "/hostvars/192.168.20.3/domain/er34w9dx/hostname",
        "value": "vm-20-92-prd.vm",
        "modifiedIndex": 25538,
        "createdIndex": 25538
      }, {
        "key": "/hostvars/192.168.20.3/domain/er34w9dx/ip",
        "value": "192.168.20.92",
        "modifiedIndex": 31549,
        "createdIndex": 31549
      }, {
        "key": "/hostvars/192.168.20.3/domain/er34w9dx/mac",
        "value": "00:16:3e:66:d1:15",
        "modifiedIndex": 31548,
        "createdIndex": 31548
      }, {
        "key": "/hostvars/192.168.20.3/domain/er34w9dx/uuid",
        "value": "d089c64e-6ffa-426f-a046-3f22b2e9e5e6",
        "modifiedIndex": 31550,
        "createdIndex": 31550
      }],
      "modifiedIndex": 25534,
      "createdIndex": 25534
    }],
    "modifiedIndex": 25053,
    "createdIndex": 25053
  }],
  "modifiedIndex": 8126,
  "createdIndex": 8126
};

var vmHostOne = {
  "key": "/hostvars/192.168.20.84",
  "dir": true,
  "nodes": [{
    "key": "/hostvars/192.168.20.84/has_problems",
    "value": "no",
    "modifiedIndex": 26595,
    "createdIndex": 26595
  }, {
    "key": "/hostvars/192.168.20.84/hostname",
    "value": "kq-fake-20-84-prd.vm",
    "modifiedIndex": 25146,
    "createdIndex": 25146
  }, {
    "key": "/hostvars/192.168.20.84/mac",
    "value": "00:16:3e:13:a4:4f",
    "modifiedIndex": 25132,
    "createdIndex": 25132
  }, {
    "key": "/hostvars/192.168.20.84/parent",
    "value": "192.168.20.3",
    "modifiedIndex": 31543,
    "createdIndex": 31543
  }],
  "modifiedIndex": 25131,
  "createdIndex": 25131
};

var vmHostTwo = {
  "key": "/hostvars/192.168.20.83",
  "dir": true,
  "nodes": [{
    "key": "/hostvars/192.168.20.83/has_problems",
    "value": "no",
    "modifiedIndex": 50223,
    "createdIndex": 50223
  }, {
    "key": "/hostvars/192.168.20.83/hostname",
    "value": "baixs-test-20-83-prd.vm",
    "modifiedIndex": 25148,
    "createdIndex": 25148
  }, {
    "key": "/hostvars/192.168.20.83/parent",
    "value": "192.168.20.3",
    "modifiedIndex": 31539,
    "createdIndex": 31539
  }],
  "modifiedIndex": 25065,
  "createdIndex": 25065
};

var vmHostThree = {
  "key": "/hostvars/192.168.20.92",
  "dir": true,
  "nodes": [{
    "key": "/hostvars/192.168.20.92/mac",
    "value": "00:16:3e:66:d1:15",
    "modifiedIndex": 25540,
    "createdIndex": 25540
  }, {
    "key": "/hostvars/192.168.20.92/parent",
    "value": "192.168.20.3",
    "modifiedIndex": 31547,
    "createdIndex": 31547
  }, {
    "key": "/hostvars/192.168.20.92/hostname",
    "value": "passport-ucenter-20-92-prd.vm.jh.hupu.com",
    "modifiedIndex": 26978,
    "createdIndex": 26978
  }],
  "modifiedIndex": 25539,
  "createdIndex": 25539
};

var hostOne = {
  "key": "/hostvars/192.168.1.1",
  "createdIndex": 423,
  "nodes": [
    {
      "createdIndex": 28455,
      "key": "/hostvars/192.168.1.1/has_problems",
      "value": "no",
      "modifiedIndex": 28455
    },
    {
      "key": "/hostvars/192.168.1.1/hostname",
      "createdIndex": 28454,
      "value": "baixs-web-1-1-prd",
      "modifiedIndex": 28454
    },
  ],
  "modifiedIndex": 423,
  "dir": true
};

var hostTwo = {
  "key": "/hostvars/192.168.1.2",
  "dir": true,
  "nodes": [{
    "key": "/hostvars/192.168.1.2/has_problems",
    "value": "yes",
    "modifiedIndex": 28386,
    "createdIndex": 28386
  }, {
    "key": "/hostvars/192.168.1.2/hostname",
    "value": "gitlab-store-1-2-tst",
    "modifiedIndex": 28385,
    "createdIndex": 28385
  }],
  "modifiedIndex": 390,
  "createdIndex": 390
};

var benches = [{
  "key": "benchs:7a870ca1c0883eb0e41d4045d9c65a7e2bca7658",
  "value": {
    "hostname": "ready-to-use.vm",
    "ip": "192.168.9.173",
    "markedAt": 1444887238019
  }
}, {
  "key": "benchs:a02d2f73471aafbe5c81366fc2e98d04ced89c4f",
  "value": {
    "hostname": "xx-5-6-switch-a-50p-v1",
    "ip": "192.168.10.4",
    "markedAt": 1443601370196
  }
}, {
  "key": "benchs:e9847359493da26d4ba98048cc5a76f5a4d8549e",
  "value": {
    "hostname": "proxy-srv-2-32-prd",
    "ip": "10.145.7.250",
    "markedAt": 1444887238018
  }
}, {
  "key": "benchs:64b2b1f479eb2b72f40d01b1f0107a3da54432a2",
  "value": {
    "hostname": "baixs-web-1-1-prd",
    "ip": "192.168.1.1",
    "markedAt": 14452452785394
  }
}];

var hostThree = {
  "hostname": "baixs-web-1-1-prd",
  "ip": "192.168.1.1",
  "markedAt": 14452452785394
};

exports.vmmOne = vmmOne;
exports.vmHostOne = vmHostOne;
exports.vmHostTwo = vmHostTwo;
exports.vmHostThree = vmHostThree;
exports.hostOne = hostOne;
exports.hostTwo = hostTwo;
exports.hostThree = hostThree;
exports.benches = benches;
exports.linkOne = linkOne;
exports.linkTwo = linkTwo;
