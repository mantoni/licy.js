/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');
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

licy.start('server', function () {
  console.log('Server running at http://localhost:1337');
});
