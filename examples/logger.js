/**
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var licy = require('../lib/licy');

licy.before('**', function () {
  if (this.event !== 'newListener' && this.event !== 'removeListener') {
    console.log('[licy] ' + this.event);
  }
});
