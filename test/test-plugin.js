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


test('plugin', {

  after: function () {
    licy.reset();
  },


  'should throw if no arguments are given': function () {
    assert.throws(function () {
      licy.plugin();
    }, /TypeError/);
  },


  'should throw if no start function was given': function () {
    assert.throws(function () {
      licy.plugin('some.plugin');
    }, /TypeError/);
  },

  'should throw if start function is object': function () {
    assert.throws(function () {
      licy.plugin('some.plugin', {});
    }, /TypeError/);
  },

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
