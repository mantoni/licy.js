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


  'should invoke start function from config': function () {
    var spy = sinon.spy();
    licy.plugin('test', { start : spy });

    licy.start('test');

    sinon.assert.calledOnce(spy);
  },


  'should throw if start function throws': function () {
    licy.plugin('test', {
      start : sinon.stub().throws(new Error('ouch'))
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
    licy.plugin('test', {
      start : function () {
        this.callback()(new Error('ouch'));
      }
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
    licy.plugin('test', { start : spy1 });

    licy.start('test', spy2);

    sinon.assert.calledOnce(spy2);
    sinon.assert.callOrder(spy1, spy2);
  },


  'should wait for the start callback to return': sinon.test(function () {
    licy.plugin('test', {
      start : function (callback) {
        setTimeout(callback, 10);
      }
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
    licy.plugin('test', { start : function () { throw err; } });

    licy.start('test', spy);

    sinon.assert.calledWith(spy, err);
  },


  'should pass null and return value to start callback': function () {
    var spy = sinon.spy();
    var val = function () {};
    licy.plugin('test', { start : function () { return val; } });

    licy.start('test', spy);

    sinon.assert.calledWith(spy, null, val);
  },


  'should pass array of values for wildcard starts': function () {
    var spy = sinon.spy();
    licy.plugin('test.1', { start : function () { return 1; } });
    licy.plugin('test.2', { start : function () { return 2; } });

    licy.start('test.*', spy);

    sinon.assert.calledWith(spy, null, [1, 2]);
  },


  'should not invoke config.start on second start attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', { start : spy });
    licy.start('test');
    spy.reset();

    try {
      licy.start('test');
    } catch (e) {}

    sinon.assert.notCalled(spy);
  },


  'should err on second start attempt': function () {
    var spy = sinon.spy();
    licy.plugin('test', { start : function () {} });

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
    licy.plugin('test', { start : function () {
      licy.start('test', spy);
    } });

    licy.start('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match({
      name    : 'Error',
      message : 'Plugin "test" already started'
    }));
  },


  'should not throw on start after stop': function () {
    licy.plugin('test', { start : function () {} });

    licy.start('test');
    licy.stop('test');

    assert.doesNotThrow(function () {
      licy.start('test');
    });
  }


});
