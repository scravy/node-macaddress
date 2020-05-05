/* jshint node: true */
'use strict';

var lib = {};
var nextTick = process.nextTick || global.setImmediate || global.setTimeout;

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
        nextTick(function () {
            task(doneIt.bind(null, key), 1);
        });
    });
}

lib.getMacAddress = require('./lib/getmacaddress.js');
lib.getAllInterfaces = require('./lib/getallinterfaces.js');

lib.networkInterfaces = require('./lib/networkinterfaces.js');

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
        lib.getMacAddress(iface, callback);
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
                nextTick(function() {
                    callback(new Error("no interfaces found"), null);
                });
            }
            return null;
        }
        if (ifaces[iface].mac) {
            if (typeof callback === 'function') {
                nextTick(function() {
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
            resolve[iface] = lib.getMacAddress.bind(null, iface);
        }
    });

    if (Object.keys(resolve).length === 0) {
        if (typeof callback === 'function') {
            nextTick(callback.bind(null, null, ifaces));
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
