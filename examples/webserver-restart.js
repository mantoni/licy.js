/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 *
 * Restarting a dependency.
 */
'use strict';

require('./logger');

var licy = require('../lib/licy');
var http = require('http');



function createHandler(id) {
  return function (req, res) {
    console.log('[' + id + '] received request ' + req.url);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('[' + id + '] Hello World\n');
  };
}

var count = 0;
licy.plugin('handler', function (handler) {
  handler.on('request', createHandler(++count));
});



licy.plugin('server', ['handler'], function (server, started) {

  var s = http.createServer(function (req, res) {
    licy.emit('handler.request', req, res);
  });
  s.listen(1337, function () {
    console.log('Server running at http://localhost:1337');
    started();
  });
  server.once('destroy', function () {
    s.close();
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

// Restart the handler every 3 seconds:
setInterval(function () {
  licy.destroy('handler', function () {
    licy.start('handler');
  });
}, 3000);
