/*
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

  before: function () {
    this.licy = licy();
  },


  'destroys all plugins': function () {
    var a = sinon.spy();
    var b = sinon.spy();
    this.licy.plugin('a', function (plugin) {
      plugin.on('destroy', a);
    });
    this.licy.plugin('b.c', function (plugin) {
      plugin.on('destroy', b);
    });
    this.licy.startAll();

    this.licy.destroyAll();

    sinon.assert.calledOnce(a);
    sinon.assert.calledOnce(b);
  },


  'does not call unrelated start listener': function () {
    var spy = sinon.spy();
    this.licy.on('unrelated.destroy', spy);

    this.licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'invokes given callback after destroy yields': function () {
    var callback  = sinon.spy();
    var onDestroy = sinon.spy(function (callback) {});
    this.licy.plugin('test', function (plugin) {
      plugin.on('destroy', onDestroy);
    });
    this.licy.start('test');

    this.licy.destroyAll(callback);

    sinon.assert.notCalled(callback);

    onDestroy.invokeCallback();

    sinon.assert.calledOnce(callback);
  },


  'does not emit destroy events again on second call': function () {
    this.licy.plugin('test', function () {});
    this.licy.start('test');
    this.licy.destroyAll();
    var spy = sinon.spy();
    this.licy.on('test.destroy', spy);

    this.licy.destroyAll();

    sinon.assert.notCalled(spy);
  },


  'collects errors and yields an ErrorList': function () {
    this.licy.plugin('a', function (plugin) {
      plugin.on('destroy', function () { throw new Error('ey'); });
    });
    this.licy.plugin('b', function (plugin) {
      plugin.on('destroy', function () { throw new Error('oh'); });
    });
    this.licy.startAll();
    var spy = sinon.spy();

    this.licy.destroyAll(spy);

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
