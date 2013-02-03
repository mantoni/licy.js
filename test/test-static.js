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


test('static', {


  'exposes listen': function () {
    assert.strictEqual(licy.listen, hubjs.listen);
  },


  'exposes View': function () {
    assert.strictEqual(licy.View, hubjs.View);
  },


  'exposes options': function () {
    assert.strictEqual(licy.options, hubjs.options);
  },


  'exposes Options': function () {
    assert.strictEqual(licy.Options, hubjs.Options);
  }


});
