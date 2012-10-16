/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');

licy.plugin('hello', function () {
  return 'Oh, hi world!';
});

licy.start('hello', function (err, hello) {
  console.log(hello);
});
