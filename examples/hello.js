/**
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');


licy.plugin('hello', function (plugin, started) {
  console.log('Starting hello');

  setTimeout(function () {

    plugin.on('oh', function (name) {
      return 'Oh, hi ' + name + '!';
    });
    started();

  }, 1000);
});


function printResult(err, result) {
  console.log(result);
}
licy.emit('hello.oh', 'world', printResult);
licy.emit('hello.oh', 'again', printResult);
