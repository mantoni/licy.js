# licy.js

Asynchronous dependency and lifecycle management for Node and the browser.

[![Build Status](https://secure.travis-ci.org/mantoni/licy.js.png?branch=master)](http://travis-ci.org/mantoni/licy.js)

## Install on Node

```
npm install licy
```

## Download for browsers

Browser packages are here: https://github.com/mantoni/licy.js/downloads.

## Usage

Nodes webserver server example sliced into some licy plugins.

```js
var licy = require('licy');
var http = require('http');

licy.plugin('config', {
  start : function () {
    return { port : 1337 };
  }
});

licy.plugin('handler', {
  start : function () {
    return function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello World\n');
    };
  }
});

licy.plugin('server', {
  dependencies : ['config', 'handler'],

  start : function (callback) {
    var dep = this.dependencies;
    var server = http.createServer(dep.handler);
    server.listen(dep.config.port, function () {
      callback(null, server);
    });
  },

  stop : function (callback) {
    this.instance.close(callback);
  }
});

licy.start('server');
```

## Hacking

If you'd like to hack licy.js here is how to get started:

 - `npm install` will setup everything you need.
 - `make` lints the code with JSLint and runs all unit tests.
 - Use can also `make lint` or `make test` individually.

Running the test cases in a browser instead of Node requires [nomo.js](https://github.com/mantoni/nomo.js).

 - Run `npm install -g nomo`
 - Run `nomo server` from within the project directory.
 - Open http://localhost:4444/test in your browser.

To build a browser package containing the merged / minified scripts run `make package`.
