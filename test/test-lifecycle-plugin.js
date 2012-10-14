/**
 * lifecycle.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');

var lifecycle = require('../lib/lifecycle');


function testIllegalArgs(name, config, message) {
  return function () {
    try {
      lifecycle.plugin(name, config);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('lifecycle.plugin', {

  after: function () {
    lifecycle.removeAllListeners();
  },


  'should throw if no arguments are given': function () {
    try {
      lifecycle.plugin();
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No arguments given.');
    }
  },


  'should throw if no config was given': function () {
    try {
      lifecycle.plugin('some.plugin');
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No config given.');
    }
  },


  'should throw if name is null': testIllegalArgs(null, {},
    'Expected name to be string, but it was null'),


  'should throw if name is object': testIllegalArgs({}, {},
    'Expected name to be string, but it was object'),


  'should throw if name is array': testIllegalArgs([], {},
    'Expected name to be string, but it was array'),


  'should throw if config is array': testIllegalArgs('test', [],
    'Expected config to be object, but it was array'),


  'should throw if config is function': testIllegalArgs('test',
    function () {}, 'Expected config to be object, but it was function'),


  'should require start function in config': function () {
    try {
      lifecycle.plugin('test', {});
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected config.start to be function, but it was undefined');
    }
  }


});
