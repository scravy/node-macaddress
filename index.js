/* jshint node: true */
'use strict';

var os = require('os');

var lib = {};

function parallel(tasks, done) {
    var results = [];
    var errs = [];
    var length = 0;
    var doneLength = 0;
    function doneIt(ix, err, result) {
        if (err) {
            errs[ix] = err;
        } else {
            results[ix] = result;
        }
        doneLength += 1;
        if (doneLength >= length) {
            done(errs.length > 0 ? errs : errs, results);
        }
    }
    Object.keys(tasks).forEach(function (key) {
        length += 1;
        var task = tasks[key];
        (process.nextTick || global.setImmediate || global.setTimeout)(function () {
            task(doneIt.bind(null, key), 1);
        });
    });
}

// Retrieves all interfaces that do feature some non-internal address.
// This function does NOT employ caching as to reflect the current state
// of the machine accurately.
lib.networkInterfaces = function () {
    var allAddresses = {};

    try {
        var ifaces = os.networkInterfaces();
    } catch (e) {
        // At October 2016 WSL does not support os.networkInterfaces() and throws
        // Return empty object as if no interfaces were found
        // https://github.com/Microsoft/BashOnWindows/issues/468
        if (e.syscall === 'uv_interface_addresses') {
            return allAddresses;
        } else {
            throw e;
        };
    };

    Object.keys(ifaces).forEach(function (iface) {
        var addresses = {};
        var hasAddresses = false;
        ifaces[iface].forEach(function (address) {
            if (!address.internal) {
                addresses[(address.family || "").toLowerCase()] = address.address;
                hasAddresses = true;
                if (address.mac && address.mac !== '00:00:00:00:00:00') {
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
var _validIfaceRegExp = '^[a-z0-9]+$';
switch (os.platform()) {

    case 'win32':
       // windows has long interface names which may contain spaces and dashes
        _validIfaceRegExp = '^[a-z0-9 -]+$';
        _getMacAddress = require('./lib/windows.js');
        break;

    case 'linux':
        _getMacAddress = require('./lib/linux.js');
        break;

    case 'darwin':
    case 'sunos':
    case 'freebsd':
        _getMacAddress = require('./lib/unix.js');
        break;

    default:
        console.warn("node-macaddress: Unknown os.platform(), defaulting to 'unix'.");
        _getMacAddress = require('./lib/unix.js');
        break;

}

var validIfaceRegExp = new RegExp(_validIfaceRegExp, 'i');

function getMacAddress(iface, callback) {

    // some platform specific ways of resolving the mac address pass the name
    // of the interface down to some command processor, so check for a well
    // formed string here.
    if (!validIfaceRegExp.test(iface)) {
        callback(new Error([
            'invalid iface: \'', iface,
            '\' (must conform to reg exp /',
            validIfaceRegExp, '/)'
        ].join('')), null);
        return;
    }

    _getMacAddress(iface, callback);
}

function promisify(func) {
    return new Promise(function (resolve, reject) {
        func(function (err, data) {
            if (err) {
                if (!err instanceof Error) {
                    err = new Error(err);
                }
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

lib.one = function () {
    // one() can be invoked in several ways:
    // one() -> Promise<string>
    // one(iface: string) -> Promise<string>
    // one(iface: string, callback) -> async, yields a string
    // one(callback) -> async, yields a string
    var iface = null;
    var callback = null;
    if (arguments.length >= 1) {
        if (typeof arguments[0] === 'function') {
            callback = arguments[0];
        } else if (typeof arguments[0] === 'string') {
            iface = arguments[0];
        }
        if (arguments.length >= 2) {
            if (typeof arguments[1] === 'function') {
                callback = arguments[1];
            }
        }
    }
    if (!callback) {
        return promisify(function (callback) {
            lib.one(iface, callback);
        });
    }

    if (iface) {
        getMacAddress(iface, callback);
    } else {
        var ifaces = lib.networkInterfaces();
        var alleged = [ 'eth0', 'eth1', 'en0', 'en1', 'en2', 'en3', 'en4' ];
        iface = Object.keys(ifaces)[0];
        for (var i = 0; i < alleged.length; i++) {
            if (ifaces[alleged[i]]) {
                iface = alleged[i];
                break;
            }
        }
        if (!ifaces[iface]) {
            if (typeof callback === 'function') {
                process.nextTick(function() {
                    callback(new Error("no interfaces found"), null);
                });
            }
            return null;
        }
        if (ifaces[iface].mac) {
            if (typeof callback === 'function') {
                process.nextTick(function() {
                    callback(null, ifaces[iface].mac);
                });
            }
            return ifaces[iface].mac;
        }
    }
    return null;
};

lib.all = function (callback) {
    if (typeof callback !== 'function') {
        return promisify(lib.all);
    }

    var ifaces = lib.networkInterfaces();
    var resolve = {};

    Object.keys(ifaces).forEach(function (iface) {
        if (!ifaces[iface].mac) {
            resolve[iface] = getMacAddress.bind(null, iface);
        }
    });

    if (Object.keys(resolve).length === 0) {
        if (typeof callback === 'function') {
            process.nextTick(callback.bind(null, null, ifaces));
        }
        return ifaces;
    }

    parallel(resolve, function (err, result) {
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
