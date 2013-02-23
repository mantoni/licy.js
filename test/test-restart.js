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
var sinon   = require('sinon');

var licy    = require('../lib/licy');


function testIllegalArgs(name, message) {
  return function () {
    try {
      licy.restart(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('require', {

  after: function () {
    licy.reset();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0,
    'Expected name to be string, but it was number'),


  'should destroy given plugin': function () {
    var spy = sinon.spy();
    licy.plugin('test', function (test) {
      test.on('destroy', spy);
    });
    licy.start('test');

    licy.restart('test');

    sinon.assert.calledOnce(spy);
  },


  'should invoke a given callback': function () {
    var spy = sinon.spy();
    licy.plugin('test', function () {});
    licy.start('test');

    licy.restart('test', spy);

    sinon.assert.calledOnce(spy);
  },


  'should start plugin again': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);
    licy.start('test');

    licy.restart('test');

    sinon.assert.calledTwice(spy);
  },


  'should not start if destroy does not return': sinon.test(function () {
    // Using sinon.test with a fake clock to avoid waiting for a timeout.
    var callCount = 0;
    licy.plugin('test', function (test) {
      callCount++;
      test.on('destroy', function () {
        this.callback();
        // Not invoking callback.
      });
    });
    licy.start('test');

    licy.restart('test');

    assert.equal(callCount, 1);
  }),


  'should not return if second start does not return': sinon.test(
    function () {
      // Using sinon.test with a fake clock to avoid waiting for a timeout.
      var spy = sinon.spy();
      var callCount = 0;
      licy.plugin('test', function (test, callback) {
        if (callCount++ === 0) {
          callback();
        }
      });
      licy.start('test');

      licy.restart('test', spy);

      sinon.assert.notCalled(spy);
    }
  ),


  'should pass null to start callback': function () {
    var spy = sinon.spy();
    licy.plugin('test', function () {});
    licy.start('test');

    licy.restart('test', spy);

    sinon.assert.calledWith(spy, null);
  },


  'queues event while destroying': function () {
    var spy     = sinon.spy();
    var destroy = sinon.spy(function (callback) {});
    licy.plugin('test', function (plugin) {
      plugin.on('foo', spy);
      plugin.on('destroy', destroy);
    });
    licy.start('test');

    licy.restart('test');
    licy.emit('test.foo');

    sinon.assert.notCalled(spy);

    destroy.invokeCallback();

    sinon.assert.calledOnce(spy);
  },


  'queues event while starting': function () {
    var spy = sinon.spy();
    var started;
    licy.plugin('test', function (plugin, callback) {
      plugin.on('foo', spy);
      started = callback;
    });
    licy.start('test');
    started();

    licy.restart('test');
    licy.emit('test.foo');

    sinon.assert.notCalled(spy);

    started();

    sinon.assert.calledOnce(spy);
  },


  'should not invoke unrelated start listener': function () {
    var spy = sinon.spy();
    licy.on('unrelated.start', spy);

    licy.restart('**');

    sinon.assert.notCalled(spy);
  }

});
