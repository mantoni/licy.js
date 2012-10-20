/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');

licy.plugin('hello', function (hello) {
  hello.on('oh', function (name) {
    return 'Oh, hi ' + name + '!';
  });
});

licy.start('hello', function (err, hello) {
  hello.emit('oh', 'world', function (err, result) {
    console.log(result);
  });
});
