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
      licy.start(name);
      assert.fail('Expection expected.');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, message);
    }
  };
}


test('start', {

  after: function () {
    licy.removeAllListeners();
  },


  'should throw if name is null': testIllegalArgs(null,
    'Expected name to be string, but it was null'),


  'should throw if name is number': testIllegalArgs(0,
    'Expected name to be string, but it was number'),


  'should invoke start function': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);

    licy.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if start function throws': function () {
    licy.plugin('test', function () {
      throw new Error('ouch');
    });

    try {
      licy.start('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should err if start function errs': function () {
    licy.plugin('test', function (test, callback) {
      callback(new Error('ouch'));
    });

    try {
      licy.start('test');
      assert.fail("Exception expected");
    } catch (e) {
      assert.equal('Error', e.name);
      assert.equal('ouch', e.message);
    }
  },


  'should invoke a given callback after starting the plugin': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    licy.plugin('test', spy1);

    licy.start('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the start callback to return': sinon.test(function () {
    licy.plugin('test', function (test, callback) {
      setTimeout(callback, 10);
    });
    var spy = sinon.spy();

    licy.start('test', spy);

    sinon.assert.notCalled(spy);
    this.clock.tick(10);
    sinon.assert.calledOnce(spy);
  }),


  'should pass error to start callback': function () {
    var spy = sinon.spy();
    var err = new Error();
    licy.plugin('test', function () { throw err; });

    licy.start('test', spy);

    sinon.assert.calledWith(spy, err);
  },


  'should pass null and created view to start callback': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test', function (test) { view = test; });

    licy.start('test', spy);

    sinon.assert.calledWith(spy, null, view);
  },


  'should pass array of views for wildcard starts': function () {
    var spy = sinon.spy();
    var views = [];
    licy.plugin('test.1', function (test) { views.push(test); });
    licy.plugin('test.2', function (test) { views.push(test); });

    licy.start('test.*', spy);

    sinon.assert.calledWith(spy, null, views);
  },


  'should create different views for each wildcard start': function () {
    var spy = sinon.spy();
    var view1, view2;
    licy.plugin('test.1', function (test) { view1 = test; });
    licy.plugin('test.2', function (test) { view2 = test; });

    licy.start('test.*', spy);

    assert.notStrictEqual(view1, view2);
  },


  'should not mess up array of values with return values': function () {
    var spy = sinon.spy();
    var view;
    licy.plugin('test.run', function (test) {
      view = test;
      return 666;
    });

    licy.start('test.*', spy);

    sinon.assert.calledWith(spy, null, [view]);
  },


  'should not invoke config.start on second start attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', spy);
    licy.start('test');
    spy.reset();

    try {
      licy.start('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second start attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', function () {});

    licy.start('test');
    licy.start('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already started'
    }));
  },


  'should err on start attempt while starting': function () {
    var spy = sinon.spy();
    licy.plugin('test', function () {
      licy.start('test', spy);
    });

    licy.start('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already started'
    }));
  },


  'should not throw on start after destroy': function () {
    licy.plugin('test', function () {});

    licy.start('test');
    licy.destroy('test');

    assert.doesNotThrow(function () {
      licy.start('test');
    });
  }


});
