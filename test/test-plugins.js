/*
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

  before: function () {
    this.licy = licy();
  },


  'registers multiple plugins': sinon.test(function () {
    this.stub(this.licy, 'plugin');
    var foo = function () {};
    var bar = function () {};

    this.licy.plugins({
      foo : foo,
      bar : bar
    });

    sinon.assert.calledTwice(this.licy.plugin);
    sinon.assert.calledWith(this.licy.plugin, 'foo', foo);
    sinon.assert.calledWith(this.licy.plugin, 'bar', bar);
  }),


  'throws if no arguments are given': function () {
    var licy = this.licy;

    assert.throws(function () {
      licy.plugins();
    }, /TypeError/);
  },


  'throws if plugins is string': function () {
    var licy = this.licy;

    assert.throws(function () {
      licy.plugins('');
    }, /TypeError/);
  },


  'throws if plugins is function': function () {
    var licy = this.licy;

    assert.throws(function () {
      licy.plugins(function () {});
    }, /TypeError/);
  }

});
