/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Nodes webserver example sliced into some licy plugins.
 */
'use strict';

require('./logger');

var licy = require('../lib/licy');
var http = require('http');


licy.plugin('config', function () {
  return { port : 1337 };
});


licy.plugin('handler', function () {
  return function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
  };
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

process.on('SIGINT', function () {
  console.log('Closing server');
  licy.destroy('server', function (err) {
    console.log(err ? err : 'Server closed.');
    process.exit();
  });
});
