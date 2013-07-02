/*
 * licy.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var licy    = require('../lib/licy');


test('restart', {

  before: function () {
    this.licy = licy();
  },

  'should destroy given plugin': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function (test) {
      test.on('destroy', spy);
    });
    this.licy.start('test');

    this.licy.restart('test');

    sinon.assert.calledOnce(spy);
  },


  'should invoke a given callback': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function () {});
    this.licy.start('test');

    this.licy.restart('test', spy);

    sinon.assert.calledOnce(spy);
  },


  'should start plugin again': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', spy);
    this.licy.start('test');

    this.licy.restart('test');

    sinon.assert.calledTwice(spy);
  },


  'should not start if destroy does not return': sinon.test(function () {
    // Using sinon.test with a fake clock to avoid waiting for a timeout.
    var callCount = 0;
    this.licy.plugin('test', function (test) {
      callCount++;
      test.on('destroy', function () {
        this.callback();
        // Not invoking callback.
      });
    });
    this.licy.start('test');

    this.licy.restart('test');

    assert.equal(callCount, 1);
  }),


  'should not return if second start does not return': sinon.test(
    function () {
      // Using sinon.test with a fake clock to avoid waiting for a timeout.
      var spy = sinon.spy();
      var callCount = 0;
      this.licy.plugin('test', function (test, callback) {
        if (callCount++ === 0) {
          callback();
        }
      });
      this.licy.start('test');

      this.licy.restart('test', spy);

      sinon.assert.notCalled(spy);
    }
  ),


  'should pass null to start callback': function () {
    var spy = sinon.spy();
    this.licy.plugin('test', function () {});
    this.licy.start('test');

    this.licy.restart('test', spy);

    sinon.assert.calledWith(spy, null);
  },


  'queues event while destroying': function () {
    var spy     = sinon.spy();
    var destroy = sinon.spy(function (callback) {});
    this.licy.plugin('test', function (plugin) {
      plugin.on('foo', spy);
      plugin.on('destroy', destroy);
    });
    this.licy.start('test');

    this.licy.restart('test');
    this.licy.emit('test.foo');

    sinon.assert.notCalled(spy);

    destroy.invokeCallback();

    sinon.assert.calledOnce(spy);
  },


  'queues event while starting': function () {
    var spy = sinon.spy();
    var started;
    this.licy.plugin('test', function (plugin, callback) {
      plugin.on('foo', spy);
      started = callback;
    });
    this.licy.start('test');
    started();

    this.licy.restart('test');
    this.licy.emit('test.foo');

    sinon.assert.notCalled(spy);

    started();

    sinon.assert.calledOnce(spy);
  },


  'should not invoke unrelated start listener': function () {
    var spy = sinon.spy();
    this.licy.on('unrelated.start', spy);

    this.licy.restart('**');

    sinon.assert.notCalled(spy);
  }

});
