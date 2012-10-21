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
    licy.removeAllListeners();
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


  'should not start if destroy does not return': function () {
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
  },


  'should not return if second start does not return': function () {
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
  },


  'should pass null and created view to start callback': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test', function (test) { view = test; });
    licy.start('test');

    licy.restart('test', spy);

    sinon.assert.calledWith(spy, null, view);
  },


  'should pass array of views for wildcard starts': function () {
    var spy = sinon.spy();
    var views = [];
    licy.plugin('test.1', function (test) { views.push(test); });
    licy.plugin('test.2', function (test) { views.push(test); });
    licy.start('test.*', spy);
    views.length = 0;

    licy.restart('test.*', spy);

    sinon.assert.calledWith(spy, null, views);
  }


});
