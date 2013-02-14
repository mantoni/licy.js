/**
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Restarting a dependency transparently.
 * While the http server is running, the request handler is restarted every
 * 5 seconds, incrementing a count on every restart.
 */
'use strict';

var licy = require('../lib/licy');


var count = 0;
licy.plugin('http.request', function (plugin) {
  console.log(' + Starting http.request');
  count++;

  plugin.on('received', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('[' + count + '] Hello Licy\n');
  });

  plugin.once('destroy', function (callback) {
    console.log(' - Destroying http.request');
    setTimeout(callback, 2000); // simulate slow plugin shutdown
  });

});


licy.plugin('http.server', function () {

  var http   = require('http');
  var server = http.createServer(function (req, res) {
    // This will lazily start the plugin on the first request:
    licy.emit('http.request.received', req, res);
  });
  server.listen(1337, function () {
    console.log('Server running at http://localhost:1337');
    console.log('Try to reload the page while the plugin restarts');
  });

});


licy.start('http.server');

// Restart the request heandler every 5000 ms:
setInterval(function () {
  licy.restart('http.request');
}, 5000);
