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


function testIllegalArgs(name, callback, message) {
  return function () {
    try {
      licy.require(name, callback);
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


  'should throw if name is null': testIllegalArgs(null, function () {},
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0, function () {},
    'Expected name to be string, but it was number'),


  'should throw if function is undefined': testIllegalArgs('test', undefined,
    'Expected callback to be function, but it was undefined'),


  'should invoke start function from config': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);

    licy.require('test', function () {});

    sinon.assert.calledOnce(spy);
  },


  'should throw if start function throws': function () {
    var spy = sinon.spy();
    licy.plugin('test', sinon.stub().throws(new Error('ouch')));

    licy.require('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name    : 'Error',
      message : 'ouch'
    });
  },


  'should err if start function errs': function () {
    var spy = sinon.spy();
    licy.plugin('test', function (test, callback) {
      callback(new Error('ouch'));
    });

    licy.require('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name    : 'Error',
      message : 'ouch'
    });
  },


  'should invoke a given callback after starting the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    licy.plugin('test', spy1);

    licy.require('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the start callback to return': sinon.test(function () {
    licy.plugin('test', function (test, callback) {
      setTimeout(callback, 10);
    });
    var spy = sinon.spy();

    licy.require('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should pass error to require callback': function () {
    var spy = sinon.spy();
    var err = new Error();
    licy.plugin('test', function () { throw err; });

    licy.require('test', spy);

    sinon.assert.calledWith(spy, err);
  },


  'should return null and view': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test', function (test) { view = test; });

    licy.require('test', spy);

    sinon.assert.calledWith(spy, null, view);
  },


  'should return null and array of views for wildcard require': function () {
    var spy = sinon.spy();
    var views = [];
    licy.plugin('test.1', function (test) { views.push(test); });
    licy.plugin('test.2', function (test) { views.push(test); });

    licy.require('test.*', spy);

    sinon.assert.calledWith(spy, null, views);
  },


  'should return error for wildcard require': function () {
    var spy = sinon.spy();
    var err = new Error();
    licy.plugin('test.ok', function () { return true; });
    licy.plugin('test.err', function () { throw err; });

    licy.require('test.*', spy);

    sinon.assert.calledWith(spy, err);
  },


  'should not invoke start on second start attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);
    licy.require('test', function () {});
    spy.reset();

    licy.require('test', function () {});

    sinon.assert.notCalled(spy);
  },


  'should return view passed to start on first require': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test', function (test) {
      view = test;
    });

    licy.require('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, sinon.match.same(view));
  },


  'should return same view on second require': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test', function (test) {
      view = test;
    });

    licy.require('test', function () {});
    licy.require('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, sinon.match.same(view));
  },


  'should not attempt to start again if currently starting': function () {
    var callCount = 0;
    licy.plugin('test', function (test, callback) { callCount++; });
    licy.start('test');

    assert.doesNotThrow(function () {
      licy.require('test', function () {});
    });

    assert.equal(callCount, 1);
  },


  'should yield view once started': function () {
    var spy = sinon.spy();
    var invoke;
    var view;
    licy.plugin('test', function (test, callback) {
      view    = test;
      invoke  = callback;
    });
    licy.start('test');

    licy.require('test', spy);
    invoke();

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, view);
  },


  'should yield error once started': function () {
    var spy = sinon.spy();
    var err = new Error();
    var invoke;
    licy.plugin('test', function (test, callback) {
      invoke = callback;
    });
    licy.start('test', function () {});

    licy.require('test', spy);
    invoke(err);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, err);
  }


});
