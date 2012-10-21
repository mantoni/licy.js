/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Nodes webserver example sliced into some licy plugins.
 * - Logs all events to the console.
 * - The config dependency requires 1 second to start.
 * - Closing the server takes 1 second.
 */
'use strict';

require('./logger');

var licy = require('../lib/licy');
var http = require('http');



licy.plugin('config', function (config) {
  config.on('port', function (callback) {
    // Deferred return value:
    setTimeout(function () {
      callback(null, 1337);
    }, 1000);
  });
});

licy.plugin('handler', function (handler) {
  handler.on('request', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
  });
});



licy.plugin('server', ['config', 'handler'], function (server, started) {

  licy.emit('config.port', function (err, port) {
    var s = http.createServer(function (req, res) {
      licy.emit('handler.request', req, res);
    });
    s.listen(port, function () {
      console.log('Server running at http://localhost:' + port);
      started();
    });
    server.on('destroy', function (destroyed) {
      s.close();
      setTimeout(destroyed, 1000);
    });
  });

});



licy.start('server');

process.on('SIGINT', function () {
  licy.destroy('**', function () {
    console.log('All plugins destroyed.');
    process.exit();
  });
});
