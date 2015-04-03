var os = require('os');
var async = require('async');

var lib = {};

lib.networkInterfaces = function () {
    var ifaces = os.networkInterfaces();
    var allAddresses = {};
    Object.keys(ifaces).forEach(function (iface) {
        addresses = {};
        var hasAddresses = false;
        ifaces[iface].forEach(function (address) {
            if (!address.internal) {
                addresses[(address.family || "").toLowerCase()] = address.address;
                hasAddresses = true;
                if (address.mac) {
                    addresses.mac = address.mac;
                }
            }
        });
        if (hasAddresses) {
            allAddresses[iface] = addresses;
        }
    });
    return allAddresses;
};

var _getMacAddress;
switch (os.platform()) {

    case 'win32':
        _getMacAddress = require('./lib/windows.js');
        break;

    case 'linux':
        _getMacAddress = require('./lib/linux.js');
        break;

    case 'darwin':
    case 'sunos':
        _getMacAddress = require('./lib/unix.js');
        break;
        
    default:
        console.warn("node-macaddress: Unkown os.platform(), defaulting to `unix'.");
        _getMacAddress = require('./lib/unix.js');
        break;

}

lib.one = function (iface, callback) {
    if (typeof iface === 'function') {
        callback = iface;

        var ifaces = lib.networkInterfaces();
        var alleged = [ 'eth0', 'eth1', 'en0', 'en1' ];
        iface = Object.keys(ifaces)[0];
        for (var i = 0; i < alleged.length; i++) {
            if (ifaces[alleged[i]]) {
                iface = alleged[i];
                break;
            }
        }
        if (!ifaces[iface]) {
            if (typeof callback === 'function') {
                callback("no interfaces found", null);
            }
            return null;
        }
        if (ifaces[iface].mac) {
            if (typeof callback === 'function') {
                callback(null, ifaces[iface].mac);
            }
            return ifaces[iface].mac;
        }
    }
    if (typeof callback === 'function') {
        _getMacAddress(iface, callback);
    }
    return null;
};

lib.all = function (callback) {

    var ifaces = lib.networkInterfaces();
    var resolve = {};

    Object.keys(ifaces).forEach(function (iface) {
        if (!ifaces[iface].mac) {
            resolve[iface] = _getMacAddress.bind(null, iface);
        }
    });

    if (Object.keys(resolve).length == 0) {
        if (typeof callback === 'function') {
            callback(null, ifaces);
        }
        return ifaces;
    }

    async.parallel(resolve, function (err, result) {
        Object.keys(result).forEach(function (iface) {
            ifaces[iface].mac = result[iface];
        });
        if (typeof callback === 'function') {
            callback(null, ifaces);
        }
    });
    return null;
};

module.exports = lib;
