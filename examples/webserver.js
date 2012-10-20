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



licy.plugin('config', function (config) {
  config.on('port', function (callback) {
    // Deferred return value:
    setTimeout(function () {
      callback(null, 1337);
    }, 500);
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
    server.once('destroy', function () {
      s.close();
    });
  });

});


licy.start('server');

process.on('SIGINT', function () {
  console.log('Closing server');
  licy.destroy('server', function (err) {
    console.log(err ? err : 'Server closed.');
    process.exit();
  });
});
