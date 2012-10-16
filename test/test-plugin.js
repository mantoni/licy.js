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
var sinon   = require('sinon');

var licy    = require('../lib/licy');


function testIllegalArgs(name, config, message) {
  return function () {
    try {
      licy.plugin(name, config);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('plugin', {

  after: function () {
    licy.removeAllListeners();
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


  'should require start function in config': function () {
    try {
      licy.plugin('test', {});
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected config.start to be function, but it was undefined');
    }
  },


  'should not throw if conifg is function': function () {
    assert.doesNotThrow(function () {
      licy.plugin('test', function () {});
    });
  },


  'should use config function as start function': function () {
    var spy = sinon.spy();

    licy.plugin('test', spy);
    licy.start('test');

    sinon.assert.calledOnce(spy);
  }


});
