/**
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');

var licy    = require('../lib/licy');


function testIllegalArgs(name, start, message) {
  return function () {
    try {
      licy.plugin(name, start);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('plugin', {

  after: function () {
    licy.reset();
  },


  'should throw if no arguments are given': function () {
    try {
      licy.plugin();
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No arguments given.');
    }
  },


  'should throw if no config was given': function () {
    try {
      licy.plugin('some.plugin');
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No start function given.');
    }
  },


  'should throw if name is null': testIllegalArgs(null, function () {},
    'Expected name to be string, but it was null'),


  'should throw if name is object': testIllegalArgs({}, function () {},
    'Expected name to be string, but it was object'),


  'should throw if name is array': testIllegalArgs([], function () {},
    'Expected name to be string, but it was array'),


  'should throw if start function is null': testIllegalArgs('test', null,
    'Expected start to be function, but it was null'),


  'should throw if start function is object': testIllegalArgs('test', {},
    'Expected start to be function, but it was object'),


  'throws if called after start was called': function () {
    licy.plugin('foo', function () {});
    licy.start('foo');

    try {
      licy.plugin('test', function () {});
      assert.fail();
    } catch (e) {
      assert.equal(e.name, 'Error');
      assert.equal(e.message, 'Cannot register plugins after start');
    }
  },


  'throws if called after startAll was called': function () {
    licy.startAll();

    try {
      licy.plugin('test', function () {});
      assert.fail();
    } catch (e) {
      assert.equal(e.name, 'Error');
      assert.equal(e.message, 'Cannot register plugins after start');
    }
  }

});
