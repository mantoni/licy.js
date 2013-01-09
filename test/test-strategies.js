/**
 * licy.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');

var hubjs   = require('hubjs');
var licy    = require('../lib/licy');


test('strategies', {


  'exposes LAST': function () {
    assert.strictEqual(licy.LAST, hubjs.LAST);
  },


  'exposes CONCAT': function () {
    assert.strictEqual(licy.CONCAT, hubjs.CONCAT);
  }


});
