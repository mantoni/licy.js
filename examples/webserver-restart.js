/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Restarting a dependency transparently.
 * While the http server is running, the request handler is restarted every
 * 500 millis, counting up on every restart.
 */
'use strict';

var licy = require('../lib/licy');
var http = require('http');


function createHandler(id) {
  return function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('[' + id + '] Hello World\n');
  };
}

var count = 0;
licy.plugin('handler', function (handler) {
  handler.on('request', createHandler(++count));
});


licy.plugin('server', ['handler'], function (server) {

  var s = http.createServer(function (req, res) {
    licy.emit('handler.request', req, res);
  });
  s.listen(1337, function () {
    console.log('Server running at http://localhost:1337');
  });

});


licy.start('server');

// Restart the handler every 500 ms:
setInterval(function () {
  licy.restart('handler');
}, 500);
