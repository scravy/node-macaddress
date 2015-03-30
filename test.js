var macaddress = require('./index');

macaddress.one(function (err, mac) {
  if (err || !/[a-f0-9]{2}(:[a-f0-9]{2}){5}/.test(mac)) {
    throw err || mac;
  }
  console.log("Mac address for this host: %s", mac);  
});

macaddress.all(function (err, all) {
  if (err) {
    throw err;
  }
  console.log(JSON.stringify(all, null, 2));
});

console.log(JSON.stringify(macaddress.networkInterfaces(), null, 2));
