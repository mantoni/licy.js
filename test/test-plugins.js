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


test('plugins', {

  after: function () {
    licy.reset();
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
    assert.throws(function () {
      licy.plugins();
    }, /TypeError/);
  },


  'throws if plugins is string': function () {
    assert.throws(function () {
      licy.plugins('');
    }, /TypeError/);
  },


  'throws if plugins is function': function () {
    assert.throws(function () {
      licy.plugins(function () {});
    }, /TypeError/);
  }

});
