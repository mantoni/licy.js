/**
 * licy.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var licy    = require('../lib/licy');


test('startall', {

  after: function () {
    licy.removeAllListeners();
  },


  'starts all plugins': function () {
    var a = sinon.spy();
    var b = sinon.spy();
    licy.plugin('a', a);
    licy.plugin('b.c', b);

    licy.startAll();

    sinon.assert.calledOnce(a);
    sinon.assert.calledOnce(b);
  },


  'does not call unrelated start listener': function () {
    var spy = sinon.spy();
    licy.on('unrelated.start', spy);

    licy.startAll();

    sinon.assert.notCalled(spy);
  },


  'invokes given callback after start yields': function () {
    var callback = sinon.spy();
    var start    = sinon.spy(function (plugin, callback) {});
    licy.plugin('test', start);

    licy.startAll(callback);

    sinon.assert.notCalled(callback);

    start.invokeCallback();

    sinon.assert.calledOnce(callback);
  }

});
