/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');

licy.on('**', function () {
  if (this.event !== 'newListener') {
    console.log('[licy] ' + this.event);
  }
});
