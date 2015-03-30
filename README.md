node-macaddress
===============

Usage
-----

```BASH
npm install --save node-macaddress
```

```JavaScript
var macaddress = require('./index');
```

API
---

    (async)  .one(iface, callback) → string
    (async)  .one(callback)        → string
    (async)  .all(callback)        → { iface: { type: address } }
    (sync)   .networkInterfaces()  → { iface: { type: address } }

---

### `.one([iface], callback)`

Retrieves the MAC address of the given `iface`.

If `iface` is omitted, this function automatically chooses an
appropriate device (e.g. `eth0` in linux, `en0` in OS X, etc.).

**Without `iface` parameter:**

```JavaScript
macaddress.one(function (err, mac) {
  console.log("Mac address for this host: %s", mac);  
});
```

```
→ Mac address for this host: ab:42:de:13:ef:37
```

**With `iface` parameter:**

```JavaScript
macaddress.one('awdl0', function (err, mac) {
  console.log("Mac address for awdl0: %s", mac);  
});
```

```
→ Mac address for awdl0: ab:cd:ef:34:12:56
```

---

### `.all(callback)`

Retrieves the MAC addresses for all non-internal interfaces.

```JavaScript
macaddress.all(function (err, all) {
  console.log(JSON.stringify(all, null, 2));
});
```

```JavaScript
{
  "en0": {
    "ipv6": "fe80::cae0:ebff:fe14:1da9",
    "ipv4": "192.168.178.20",
    "mac": "ab:42:de:13:ef:37"
  },
  "awdl0": {
    "ipv6": "fe80::58b9:daff:fea9:23a9",
    "mac": "ab:cd:ef:34:12:56"
  }
}
```

---

### `.networkInterfaces()`

A useful replacement of `os.networkInterfaces()`. Reports only non-internal interfaces.

```JavaScript
console.log(JSON.stringify(macaddress.networkInterfaces(), null, 2));
```

```JavaScript
{
  "en0": {
    "ipv6": "fe80::cae0:ebff:fe14:1dab",
    "ipv4": "192.168.178.22"
  },
  "awdl0": {
    "ipv6": "fe80::58b9:daff:fea9:23a9"
  }
}
```

