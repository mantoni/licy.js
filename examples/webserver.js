/**
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Nodes webserver example sliced into some licy plugins.
 * - Logs all events to the console.
 * - The config dependency starts after 2 seconds.
 * - Closing the server returns after 1 second.
 */
'use strict';

require('./logger');

var licy = require('../lib/licy');


licy.plugin('config', function (plugin) {

  plugin.on('port', function (callback) {
    // Deferred return value:
    setTimeout(function () {
      callback(null, 1337);
    }, 2000);
  });

});


licy.plugin('http.request', function (plugin) {

  plugin.on('received', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello Licy\n');
  });

});



licy.plugin('http.server', function (plugin, started) {

  licy.emit('config.port', function (err, port) {
    var http   = require('http');
    var server = http.createServer(function (req, res) {
      licy.emit('http.request.received', req, res);
    });
    server.listen(port, function () {
      console.log('Server running at http://localhost:' + port);
      started();
    });

    plugin.once('destroy', function (destroyed) {
      server.close();
      setTimeout(destroyed, 1000);
    });
  });

});



licy.start('http.server');

process.on('SIGINT', function () {
  licy.destroy('**', function () {
    console.log('All plugins destroyed.');
    process.exit();
  });
});
