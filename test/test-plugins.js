/**
 * licy.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var licy   = require('../lib/licy');


function testIllegalArgs(plugins, message) {
  return function () {
    try {
      licy.plugins(plugins);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('plugins', {

  after: function () {
    licy.removeAllListeners();
  },


  'registers multiple plugins': sinon.test(function () {
    this.stub(licy, 'plugin');
    var foo = function () {};
    var bar = function () {};

    licy.plugins({
      foo : foo,
      bar : bar
    });

    sinon.assert.calledTwice(licy.plugin);
    sinon.assert.calledWith(licy.plugin, 'foo', foo);
    sinon.assert.calledWith(licy.plugin, 'bar', bar);
  }),


  'throws if no arguments are given': function () {
    try {
      licy.plugins();
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No arguments given.');
    }
  },


  'throws if plugins is null': testIllegalArgs(null,
    'Expected plugins to be object, but it was null'),


  'throws if plugins is string': testIllegalArgs('',
    'Expected plugins to be object, but it was string'),


  'throws if plugins is array': testIllegalArgs([],
    'Expected plugins to be object, but it was array')

});
