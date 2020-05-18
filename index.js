/* jshint node: true */
"use strict";

var util = require("./lib/util.js");
var lib = {};

lib.getMacAddress     = require("./lib/getmacaddress.js");
lib.getAllInterfaces  = require("./lib/getallinterfaces.js");
lib.networkInterfaces = require("./lib/networkinterfaces.js");

lib.one = function () {
    // one() can be invoked in several ways:
    // one() -> Promise<string>
    // one(iface: string) -> Promise<string>
    // one(iface: string, callback) -> async, yields a string
    // one(callback) -> async, yields a string
    var iface = null;
    var callback = null;
    if (arguments.length >= 1) {
        if (typeof arguments[0] === "function") {
            callback = arguments[0];
        } else if (typeof arguments[0] === "string") {
            iface = arguments[0];
        }
        if (arguments.length >= 2) {
            if (typeof arguments[1] === "function") {
                callback = arguments[1];
            }
        }
    }
    if (!callback) {
        return util.promisify(function (callback) {
            lib.one(iface, callback);
        });
    }
    if (iface) {
        lib.getMacAddress(iface, callback);
        return;
    }
    var ifaces = lib.networkInterfaces();
    var addresses = {};
    var best = [];
    var args = [];
    Object.keys(ifaces).forEach(function (d) {
        args.push(d);
        if (typeof ifaces[d].mac === "string" && ifaces[d].mac !== "00:00:00:00:00:00") {
            addresses[d] = ifaces[d].mac;
            if (ifaces[d].ipv4 || ifaces[d].ipv6) {
                if (ifaces[d].ipv4 && ifaces[d].ipv6) {
                    best.unshift(addresses[d]);
                } else {
                    best.push(addresses[d]);
                }
            }
        }
    });
    if (best.length > 0) {
        util.nextTick(callback.bind(null, null, best[0]));
        return;
    }
    args.push(lib.getAllInterfaces);
    var getMacAddress = function (d, cb) {
        if (addresses[d]) {
            cb(null, addresses[d]);
            return;
        }
        lib.getMacAddress(d, cb);
    };
    util.iterate(args, getMacAddress, callback);
};

lib.all = function (callback) {
    if (typeof callback !== "function") {
        return util.promisify(lib.all);
    }

    var ifaces = lib.networkInterfaces();
    var resolve = {};

    Object.keys(ifaces).forEach(function (iface) {
        if (!ifaces[iface].mac) {
            resolve[iface] = lib.getMacAddress.bind(null, iface);
        }
    });

    if (Object.keys(resolve).length === 0) {
        if (typeof callback === "function") {
            util.nextTick(callback.bind(null, null, ifaces));
        }
        return ifaces;
    }

    util.parallel(resolve, function (err, result) {
        Object.keys(result).forEach(function (iface) {
            ifaces[iface].mac = result[iface];
        });
        if (typeof callback === "function") {
            callback(null, ifaces);
        }
    });
    return null;
};

module.exports = lib;
