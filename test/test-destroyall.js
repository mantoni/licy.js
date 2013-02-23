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


test('destroyall', {

  after: function () {
    licy.reset();
  },


  'destroys all plugins': function () {
    var a = sinon.spy();
    var b = sinon.spy();
    licy.plugin('a', function (plugin) {
      plugin.on('destroy', a);
    });
    licy.plugin('b.c', function (plugin) {
      plugin.on('destroy', b);
    });
    licy.startAll();

    licy.destroyAll();

    sinon.assert.calledOnce(a);
    sinon.assert.calledOnce(b);
  },


  'does not call unrelated start listener': function () {
    var spy = sinon.spy();
    licy.on('unrelated.destroy', spy);

    licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'invokes given callback after destroy yields': function () {
    var callback  = sinon.spy();
    var onDestroy = sinon.spy(function (callback) {});
    licy.plugin('test', function (plugin) {
      plugin.on('destroy', onDestroy);
    });
    licy.start('test');

    licy.destroyAll(callback);

    sinon.assert.notCalled(callback);

    onDestroy.invokeCallback();

    sinon.assert.calledOnce(callback);
  },


  'does not emit destroy events again on second call': function () {
    licy.plugin('test', function () {});
    licy.start('test');
    licy.destroyAll();
    var spy = sinon.spy();
    licy.on('test.destroy', spy);

    licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'collects errors and yields an ErrorList': function () {
    licy.plugin('a', function (plugin) {
      plugin.on('destroy', function () { throw new Error('ey'); });
    });
    licy.plugin('b', function (plugin) {
      plugin.on('destroy', function () { throw new Error('oh'); });
    });
    licy.startAll();
    var spy = sinon.spy();

    licy.destroyAll(spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name   : 'ErrorList',
      errors : [
        sinon.match.has('message', 'ey'),
        sinon.match.has('message', 'oh')
      ]
    });
  }

});
